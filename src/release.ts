import type { Episode, ReleaseStrategy, Show } from "./types.js";

export const strategies: Record<ReleaseStrategy, string> = {
  US_PRIMETIME: "21:00:00",
  GLOBAL_MIDNIGHT_PT: "00:00:00",
  GLOBAL_MIDNIGHT_ET: "00:00:00",
  DEFAULT: "00:00:00",
};

export const strategyTimeZone: Record<ReleaseStrategy, string | undefined> = {
  US_PRIMETIME: "America/New_York",
  GLOBAL_MIDNIGHT_PT: "America/Los_Angeles",
  GLOBAL_MIDNIGHT_ET: "America/New_York",
  DEFAULT: undefined,
};

export const platformStrategy: Record<string, ReleaseStrategy> = {
  HBO: "US_PRIMETIME",
  "Apple TV": "GLOBAL_MIDNIGHT_PT",
  "Apple TV+": "GLOBAL_MIDNIGHT_PT",
  Netflix: "GLOBAL_MIDNIGHT_PT",
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?$/;
const isoDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

export function resolveDateTime(show: Show, episode: Episode): string {
  if (episode.exactRelease) {
    return normalizeIsoDateTime(episode.exactRelease);
  }

  if (show.releaseTime) {
    return combineDateAndTime(episode.air_date, show.releaseTime);
  }

  const strategy = show.network ? platformStrategy[show.network] : undefined;
  const time = strategy ? strategies[strategy] : strategies.DEFAULT;

  return combineDateAndTime(episode.air_date, time);
}

export function resolveReleaseTimeZone(show: Show, episode: Episode): string | undefined {
  if (episode.exactRelease || show.releaseTime) {
    return undefined;
  }

  const strategy = show.network ? platformStrategy[show.network] : undefined;

  return strategy ? strategyTimeZone[strategy] : strategyTimeZone.DEFAULT;
}

export function combineDateAndTime(date: string, time: string): string {
  if (!isoDatePattern.test(date)) throw new Error(`Invalid air date: ${date}`);
  if (!timePattern.test(time)) throw new Error(`Invalid release time: ${time}`);
  return `${date}T${time}`;
}

export function normalizeIsoDateTime(value: string): string {
  if (!isoDateTimePattern.test(value)) throw new Error(`Invalid timestamp: ${value}`);
  return value;
}
