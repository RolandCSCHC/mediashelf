import { MediaStatus, MediaType } from '@mediashelf/shared-types';

export type ParsedLibraryLine = {
  lineNumber: number;
  rawLine: string;
  searchQuery: string;
  type: MediaType;
  status: MediaStatus;
  downloaded: boolean;
  notes: string | null;
};

type SectionConfig = {
  type: MediaType;
  status: MediaStatus;
  downloaded: boolean;
};

const SECTION_MAP: Record<string, SectionConfig> = {
  'upcoming movies': {
    type: MediaType.MOVIE,
    status: MediaStatus.FUTURE,
    downloaded: false,
  },
  'downloaded movies': {
    type: MediaType.MOVIE,
    status: MediaStatus.WATCHLIST,
    downloaded: true,
  },
  'upcoming series': {
    type: MediaType.SERIES,
    status: MediaStatus.FUTURE,
    downloaded: false,
  },
  'downloaded series': {
    type: MediaType.SERIES,
    status: MediaStatus.WATCHLIST,
    downloaded: true,
  },
};

const URL_RE = /https?:\/\/\S+/gi;
const WATCHING_MARKER_RE = /-{3,}\s*$/;
const NUMBERED_LINE_RE = /^\s*\d+\)\s*(.*)$/;
const MONTH_NAMES =
  'january|february|march|april|may|june|july|august|september|october|november|december';
const SEASON_WORDS = 'summer|fall|autumn|winter|spring';
const DATE_PAREN_RE = new RegExp(
  `^((?:${MONTH_NAMES})(?:\\s+\\d{1,2})?(?:,?\\s*\\d{4})?|(?:${SEASON_WORDS}),?\\s*\\d{4}|\\d{4})$`,
  'i',
);
const RANGE_PAREN_RE = /^(S\d+(?:\s*-\s*\d+)?|E\d+(?:\s*-\s*\d+)?)$/i;
const VARIANT_PAREN_RE = /^(animated|live-action|live action)$/i;

export function parseLibraryTxt(text: string): {
  items: ParsedLibraryLine[];
  skippedEmptyLines: number;
} {
  const items: ParsedLibraryLine[] = [];
  let skippedEmptyLines = 0;
  let section: SectionConfig | null = null;

  const lines = text.replace(/\r\n/g, '\n').split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const trimmed = rawLine.trim();

    if (!trimmed) {
      continue;
    }

    const sectionKey = trimmed.replace(/:$/, '').trim().toLowerCase();
    if (SECTION_MAP[sectionKey]) {
      section = SECTION_MAP[sectionKey];
      continue;
    }

    if (!section) {
      continue;
    }

    const numbered = NUMBERED_LINE_RE.exec(trimmed);
    if (!numbered) {
      continue;
    }

    const lineNumber = index + 1;
    let body = numbered[1]?.trim() ?? '';
    if (!body) {
      skippedEmptyLines += 1;
      continue;
    }

    const watching = WATCHING_MARKER_RE.test(body);
    if (watching) {
      body = body.replace(WATCHING_MARKER_RE, '').trim();
    }

    const urls = body.match(URL_RE) ?? [];
    body = body.replace(URL_RE, ' ').replace(/\s+/g, ' ').trim();
    body = body.replace(/\(\s*\)/g, '').replace(/:\s*$/, '').trim();

    const noteParts: string[] = [];
    const searchHints: string[] = [];

    // Peel trailing parentheticals from the end while classifying them.
    let changed = true;
    while (changed) {
      changed = false;
      const match = body.match(/\(([^()]+)\)\s*$/);
      if (!match || match.index === undefined) {
        break;
      }

      const inner = match[1]?.trim() ?? '';
      if (!inner) {
        body = body.slice(0, match.index).trim();
        changed = true;
        continue;
      }

      if (DATE_PAREN_RE.test(inner)) {
        body = body.slice(0, match.index).trim();
        changed = true;
        continue;
      }

      if (RANGE_PAREN_RE.test(inner)) {
        noteParts.unshift(inner.replace(/\s+/g, ''));
        body = body.slice(0, match.index).trim();
        changed = true;
        continue;
      }

      if (VARIANT_PAREN_RE.test(inner)) {
        searchHints.unshift(inner);
        noteParts.unshift(inner);
        body = body.slice(0, match.index).trim();
        changed = true;
        continue;
      }

      // Unknown parenthetical — leave it on the title for TMDB search.
      break;
    }

    body = body.replace(/[(:\-\s]+$/g, '').trim();
    if (!body) {
      skippedEmptyLines += 1;
      continue;
    }

    for (const url of urls) {
      noteParts.push(url.replace(/[)\].,;]+$/g, ''));
    }

    const notes = noteParts.length > 0 ? noteParts.join('\n') : null;
    const searchQuery =
      searchHints.length > 0 ? `${body} ${searchHints.join(' ')}` : body;

    let status = section.status;
    let downloaded = section.downloaded;

    if (watching) {
      status = MediaStatus.WATCHING;
    }

    // Links mean available online, not downloaded locally.
    if (urls.length > 0) {
      downloaded = false;
    }

    items.push({
      lineNumber,
      rawLine: trimmed,
      searchQuery,
      type: section.type,
      status,
      downloaded,
      notes,
    });
  }

  return { items, skippedEmptyLines };
}

export function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function scoreTitleMatch(
  query: string,
  candidateTitle: string,
): 'high' | 'medium' | 'low' {
  const q = normalizeTitle(query);
  const t = normalizeTitle(candidateTitle);

  if (!q || !t) {
    return 'low';
  }
  if (q === t) {
    return 'high';
  }
  if (t.startsWith(q) || q.startsWith(t)) {
    return 'medium';
  }
  if (t.includes(q) || q.includes(t)) {
    return 'medium';
  }
  return 'low';
}
