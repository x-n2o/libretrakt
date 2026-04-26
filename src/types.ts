export type ReleaseStrategy =
  | "US_PRIMETIME"
  | "GLOBAL_MIDNIGHT_PT"
  | "GLOBAL_MIDNIGHT_ET"
  | "DEFAULT";

export type ExactReleaseMap = Record<string, string>;

export type ShowConfig = {
  slug: string;
  title: string;
  tmdbId: number;
  network?: string;
  releaseTime?: string;
  exactReleases?: ExactReleaseMap;
};

export type Show = ShowConfig & {
  source: "catalog" | "tmdb";
};

export type Episode = {
  season: number;
  number: number;
  title: string;
  air_date: string;
  exactRelease?: string;
  runtimeMinutes?: number;
};

export type ShowEpisode = {
  show: Show;
  episode: Episode;
  startsAt: string;
  durationMinutes?: number;
};

export type Env = {
  TMDB_API_TOKEN?: string;
  API_TOKEN?: string;
  TMDB_API_KEY?: string;
  API_KEY?: string;
};

export type TmdbNetwork = {
  id: number;
  name: string;
};

export type TmdbSeasonSummary = {
  season_number: number;
};

export type TmdbShowDetails = {
  id: number;
  name: string;
  networks?: TmdbNetwork[];
  seasons?: TmdbSeasonSummary[];
  episode_run_time?: number[];
};

export type TmdbSearchResult = {
  id: number;
  name: string;
  first_air_date?: string;
  overview?: string;
};

export type TmdbSearchResponse = {
  results?: TmdbSearchResult[];
};

export type TmdbEpisode = {
  episode_number: number;
  name: string;
  air_date: string | null;
  overview?: string;
  runtime?: number | null;
};

export type TmdbSeasonDetails = {
  season_number: number;
  episodes?: TmdbEpisode[];
};
