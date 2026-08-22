export type TmdbGenre = { id: number; name: string };

export type TmdbCastMember = {
  id: number;
  name?: string;
  character?: string;
  order?: number;
  profile_path?: string | null;
};

export type TmdbCrewMember = {
  id: number;
  name?: string;
  job?: string;
  profile_path?: string | null;
};

export type TmdbCredits = {
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
};

export type TmdbCreator = {
  id: number;
  name?: string;
  profile_path?: string | null;
};

export type TmdbMovieDetailsResponse = {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  genres?: TmdbGenre[];
  runtime?: number | null;
  vote_average?: number;
  credits?: TmdbCredits;
};

export type TmdbTvDetailsResponse = {
  id: number;
  name: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  last_air_date?: string;
  genres?: TmdbGenre[];
  episode_run_time?: number[];
  vote_average?: number;
  number_of_seasons?: number;
  created_by?: TmdbCreator[];
  credits?: TmdbCredits;
};
