import type { TmdbTitleDetails } from '@mediashelf/shared-types';
import { TmdbPersonList } from '@/components/tmdb-person-list';

type TmdbTitleCreditsProps = {
  details: TmdbTitleDetails;
};

export function TmdbTitleCredits({ details }: TmdbTitleCreditsProps) {
  return (
    <>
      <TmdbPersonList title="Directors" people={details.directors} />
      <TmdbPersonList title="Created by" people={details.creators} />
      <TmdbPersonList title="Cast" people={details.cast} />
    </>
  );
}
