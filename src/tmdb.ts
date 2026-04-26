import { resolveDateTime } from "./release.js";
import type {
  Env,
  Episode,
  Show,
  ShowEpisode,
  TmdbEpisode,
  TmdbSeasonDetails,
  TmdbSearchResponse,
  TmdbSearchResult,
  TmdbShowDetails,
} from "./types.js";

const tmdbBaseUrl = "https://api.themoviedb.org/3";

export async function getShowEpisodes(
  env: Env,
  show: Show,
  fetcher: typeof fetch = fetch,
): Promise<ShowEpisode[]> {
  const details = await fetchTmdb<TmdbShowDetails>(env, `/tv/${show.tmdbId}`, fetcher);
  const resolvedShow = hydrateShow(show, details);
  const defaultRuntimeMinutes = pickDefaultRuntimeMinutes(details);
  const seasons = details.seasons ?? [];
  const seasonNumbers = seasons
    .map((season) => season.season_number)
    .filter((seasonNumber) => Number.isInteger(seasonNumber) && seasonNumber > 0)
    .sort((a, b) => a - b);

  const seasonDetails = await Promise.all(
    seasonNumbers.map((seasonNumber) =>
      fetchTmdb<TmdbSeasonDetails>(env, `/tv/${show.tmdbId}/season/${seasonNumber}`, fetcher),
    ),
  );

  return seasonDetails
    .flatMap((season) => mapSeasonEpisodes(resolvedShow, season, defaultRuntimeMinutes))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.show.title.localeCompare(b.show.title));
}

export async function searchShows(
  env: Env,
  query: string,
  fetcher: typeof fetch = fetch,
): Promise<TmdbSearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const response = await fetchTmdb<TmdbSearchResponse>(
    env,
    `/search/tv?query=${encodeURIComponent(normalizedQuery)}`,
    fetcher,
  );

  return (response.results ?? [])
    .filter((result) => Number.isSafeInteger(result.id) && result.name)
    .slice(0, 10);
}

async function fetchTmdb<T>(
  env: Env,
  path: string,
  fetcher: typeof fetch,
): Promise<T> {
  const token = env.TMDB_API_TOKEN ?? env.API_TOKEN;
  const apiKey = env.TMDB_API_KEY ?? env.API_KEY;

  const separator = path.includes("?") ? "&" : "?";
  const authenticatedPath = apiKey
    ? `${path}${separator}api_key=${encodeURIComponent(apiKey)}`
    : path;
  const languageSeparator = authenticatedPath.includes("?") ? "&" : "?";

  if (!token && !apiKey) {
    throw new Error("TMDB_API_TOKEN or TMDB_API_KEY is not configured.");
  }

  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetcher(`${tmdbBaseUrl}${authenticatedPath}${languageSeparator}language=en-US`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`TMDb request failed for ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

function hydrateShow(show: Show, details: TmdbShowDetails): Show {
  const network = show.network ?? details.networks?.[0]?.name;
  const hydrated: Show = {
    ...show,
    title: details.name || show.title,
  };

  if (network) {
    hydrated.network = network;
  }

  return hydrated;
}

function mapSeasonEpisodes(
  show: Show,
  season: TmdbSeasonDetails,
  defaultRuntimeMinutes?: number,
): ShowEpisode[] {
  return (season.episodes ?? [])
    .filter((episode) => episode.air_date)
    .map((episode) => {
      const mappedEpisode = mapEpisode(show, season.season_number, episode, defaultRuntimeMinutes);
      const mappedShowEpisode: ShowEpisode = {
        show,
        episode: mappedEpisode,
        startsAt: resolveDateTime(show, mappedEpisode),
      };

      if (mappedEpisode.runtimeMinutes) {
        mappedShowEpisode.durationMinutes = mappedEpisode.runtimeMinutes;
      }

      return mappedShowEpisode;
    });
}

function mapEpisode(
  show: Show,
  seasonNumber: number,
  episode: TmdbEpisode,
  defaultRuntimeMinutes?: number,
): Episode {
  const airDate = episode.air_date;

  if (!airDate) {
    throw new Error("Cannot map TMDb episode without air_date.");
  }

  const exactReleaseKey = `${seasonNumber}x${episode.episode_number}`;

  const mapped: Episode = {
    season: seasonNumber,
    number: episode.episode_number,
    title: episode.name || "Episode",
    air_date: airDate,
  };

  const runtimeMinutes = normalizeRuntimeMinutes(episode.runtime) ?? defaultRuntimeMinutes;

  if (runtimeMinutes) {
    mapped.runtimeMinutes = runtimeMinutes;
  }

  const exactRelease = show.exactReleases?.[exactReleaseKey];

  if (exactRelease) {
    mapped.exactRelease = exactRelease;
  }

  return mapped;
}

function pickDefaultRuntimeMinutes(details: TmdbShowDetails): number | undefined {
  for (const runtime of details.episode_run_time ?? []) {
    const normalized = normalizeRuntimeMinutes(runtime);

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function normalizeRuntimeMinutes(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const rounded = Math.round(value);

  if (!Number.isInteger(rounded) || rounded < 1) {
    return undefined;
  }

  return rounded;
}
