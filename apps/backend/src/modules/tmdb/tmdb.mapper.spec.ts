import { MediaType } from '@mediashelf/shared-types';
import {
  mapCast,
  mapCreators,
  mapDirectors,
  mapMovieTitleDetails,
  mapSeriesTitleDetails,
  TMDB_CAST_LIMIT,
} from './tmdb.mapper';

describe('tmdb.mapper', () => {
  describe('mapCast', () => {
    it('sorts by order, limits length, and drops blank names', () => {
      const cast = mapCast([
        {
          id: 2,
          name: 'Second',
          character: 'B',
          order: 1,
          profile_path: '/b.jpg',
        },
        {
          id: 1,
          name: 'First',
          character: 'A',
          order: 0,
          profile_path: '/a.jpg',
        },
        { id: 3, name: '   ', character: 'C', order: 2 },
        { id: 4, name: 'Later', character: 'D', order: 3 },
      ]);

      expect(cast).toEqual([
        {
          tmdbId: 1,
          name: 'First',
          role: 'A',
          profilePath: '/a.jpg',
        },
        {
          tmdbId: 2,
          name: 'Second',
          role: 'B',
          profilePath: '/b.jpg',
        },
        {
          tmdbId: 4,
          name: 'Later',
          role: 'D',
          profilePath: null,
        },
      ]);
    });

    it('caps cast at the preview limit', () => {
      const cast = mapCast(
        Array.from({ length: TMDB_CAST_LIMIT + 5 }, (_, index) => ({
          id: index + 1,
          name: `Actor ${index + 1}`,
          order: index,
        })),
      );

      expect(cast).toHaveLength(TMDB_CAST_LIMIT);
      expect(cast[0]?.name).toBe('Actor 1');
      expect(cast[TMDB_CAST_LIMIT - 1]?.name).toBe(`Actor ${TMDB_CAST_LIMIT}`);
    });
  });

  describe('mapDirectors', () => {
    it('keeps unique Director credits in crew order', () => {
      const directors = mapDirectors([
        {
          id: 10,
          name: 'Jane Director',
          job: 'Director',
          profile_path: '/j.jpg',
        },
        { id: 11, name: 'Pat Producer', job: 'Producer' },
        {
          id: 10,
          name: 'Jane Director',
          job: 'Director',
          profile_path: '/j.jpg',
        },
        { id: 12, name: 'Sam Director', job: 'Director' },
      ]);

      expect(directors).toEqual([
        {
          tmdbId: 10,
          name: 'Jane Director',
          role: 'Director',
          profilePath: '/j.jpg',
        },
        {
          tmdbId: 12,
          name: 'Sam Director',
          role: 'Director',
          profilePath: null,
        },
      ]);
    });
  });

  describe('mapCreators', () => {
    it('maps unique series creators', () => {
      const creators = mapCreators([
        { id: 1, name: 'Vince', profile_path: '/v.jpg' },
        { id: 1, name: 'Vince' },
        { id: 2, name: 'Peter' },
      ]);

      expect(creators).toEqual([
        {
          tmdbId: 1,
          name: 'Vince',
          role: 'Creator',
          profilePath: '/v.jpg',
        },
        {
          tmdbId: 2,
          name: 'Peter',
          role: 'Creator',
          profilePath: null,
        },
      ]);
    });
  });

  describe('mapMovieTitleDetails', () => {
    it('maps movie details and credits', () => {
      const details = mapMovieTitleDetails({
        id: 550,
        title: 'Fight Club',
        overview: 'An insomniac office worker...',
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        release_date: '1999-10-15',
        genres: [{ id: 18, name: 'Drama' }],
        runtime: 139,
        vote_average: 8.4,
        credits: {
          cast: [
            {
              id: 819,
              name: 'Edward Norton',
              character: 'The Narrator',
              order: 0,
              profile_path: '/n.jpg',
            },
          ],
          crew: [
            {
              id: 7467,
              name: 'David Fincher',
              job: 'Director',
              profile_path: '/d.jpg',
            },
          ],
        },
      });

      expect(details.type).toBe(MediaType.MOVIE);
      expect(details.tmdbId).toBe(550);
      expect(details.title).toBe('Fight Club');
      expect(details.runtime).toBe(139);
      expect(details.seasonCount).toBeNull();
      expect(details.lastAirDate).toBeNull();
      expect(details.creators).toEqual([]);
      expect(details.directors).toHaveLength(1);
      expect(details.cast[0]?.name).toBe('Edward Norton');
    });

    it('nulls empty optional fields and zero ratings', () => {
      const details = mapMovieTitleDetails({
        id: 1,
        title: '  ',
        overview: '   ',
        runtime: 0,
        vote_average: 0,
      });

      expect(details.title).toBe('Untitled');
      expect(details.overview).toBeNull();
      expect(details.runtime).toBeNull();
      expect(details.voteAverage).toBeNull();
      expect(details.directors).toEqual([]);
      expect(details.cast).toEqual([]);
    });
  });

  describe('mapSeriesTitleDetails', () => {
    it('maps series details, creators, and episode runtime', () => {
      const details = mapSeriesTitleDetails({
        id: 1396,
        name: 'Breaking Bad',
        overview: 'A chemistry teacher...',
        first_air_date: '2008-01-20',
        last_air_date: '2013-09-29',
        genres: [{ id: 18, name: 'Drama' }],
        episode_run_time: [47, 58],
        vote_average: 8.9,
        number_of_seasons: 5,
        created_by: [{ id: 66633, name: 'Vince Gilligan' }],
        credits: {
          cast: [
            {
              id: 17419,
              name: 'Bryan Cranston',
              character: 'Walter White',
              order: 0,
            },
          ],
          crew: [{ id: 1, name: 'Episode Director', job: 'Director' }],
        },
      });

      expect(details.type).toBe(MediaType.SERIES);
      expect(details.releaseDate).toBe('2008-01-20');
      expect(details.lastAirDate).toBe('2013-09-29');
      expect(details.runtime).toBe(47);
      expect(details.seasonCount).toBe(5);
      expect(details.creators[0]?.name).toBe('Vince Gilligan');
      expect(details.directors).toEqual([]);
      expect(details.cast[0]?.role).toBe('Walter White');
    });
  });
});
