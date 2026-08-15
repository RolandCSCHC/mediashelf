'use client';

import type { TmdbPerson } from '@mediashelf/shared-types';
import { useI18n } from '@/components/locale-provider';
import { tmdbProfileUrl } from '@/lib/tmdb-images';

type TmdbPersonListProps = {
  title: string;
  people: TmdbPerson[];
};

export function TmdbPersonList({ title, people }: TmdbPersonListProps) {
  const { t } = useI18n();

  if (people.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
        {title}
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {people.map((person) => {
          const photo = tmdbProfileUrl(person.profilePath, 'w185');

          return (
            <li
              key={`${person.tmdbId}-${person.role ?? 'credit'}`}
              className="min-w-0"
            >
              <div className="overflow-hidden rounded-md border border-border bg-[var(--overlay)]">
                <div className="aspect-[2/3] bg-[var(--overlay)]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover object-top"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
                      {t('common.noPhoto')}
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 truncate text-sm font-medium text-foreground">
                {person.name}
              </p>
              {person.role ? (
                <p className="truncate text-xs text-muted">{person.role}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
