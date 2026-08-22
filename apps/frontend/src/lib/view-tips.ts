export const VIEW_TIP_IDS = [
  'library',
  'search',
  'lists',
  'list-detail',
  'backup',
] as const;

export type ViewTipId = (typeof VIEW_TIP_IDS)[number];

export const DISMISSED_TIPS_STORAGE_KEY = 'mediashelf-dismissed-tips';

const listeners = new Set<() => void>();
let snapshot: readonly ViewTipId[] = [];
let didRead = false;

function isViewTipId(value: unknown): value is ViewTipId {
  return (
    typeof value === 'string' &&
    (VIEW_TIP_IDS as readonly string[]).includes(value)
  );
}

function parseDismissed(raw: string | null): ViewTipId[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isViewTipId);
  } catch {
    return [];
  }
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function onStorage(event: StorageEvent) {
  if (event.key !== DISMISSED_TIPS_STORAGE_KEY) {
    return;
  }
  snapshot = parseDismissed(event.newValue);
  emit();
}

function ensureRead() {
  if (didRead || typeof window === 'undefined') {
    return;
  }
  didRead = true;
  try {
    snapshot = parseDismissed(
      window.localStorage.getItem(DISMISSED_TIPS_STORAGE_KEY),
    );
  } catch {
    snapshot = [];
  }
}

function persist(next: ViewTipId[]) {
  didRead = true;
  snapshot = next;
  try {
    window.localStorage.setItem(
      DISMISSED_TIPS_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    // Ignore quota / private-mode write errors.
  }
  emit();
}

export function subscribeDismissedTips(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== 'undefined' && listeners.size === 1) {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined' && listeners.size === 0) {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function isTipDismissed(id: ViewTipId): boolean {
  ensureRead();
  return snapshot.includes(id);
}

export function dismissTip(id: ViewTipId) {
  ensureRead();
  if (snapshot.includes(id)) {
    return;
  }
  persist([...snapshot, id]);
}

export function restoreAllTips() {
  persist([]);
}
