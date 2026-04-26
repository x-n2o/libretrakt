import type { Episode, ReleaseStrategy, Show } from "./types.js";

export const strategies: Record<ReleaseStrategy, string> = {
  US_PRIMETIME: "02:00:00Z",
  GLOBAL_MIDNIGHT_PT: "07:00:00Z",
  GLOBAL_MIDNIGHT_ET: "05:00:00Z",
  DEFAULT: "00:00:00Z",
};

export const platformStrategy: Record<string, ReleaseStrategy> = {
  HBO: "US_PRIMETIME",
  "Apple TV+": "GLOBAL_MIDNIGHT_PT",
  Netflix: "GLOBAL_MIDNIGHT_PT",
};

export function resolveDateTime(show: Show, episode: Episode): string {
  if (episode.exactRelease) {
    return normalizeIsoUtc(episode.exactRelease);
  }

  if (show.releaseTime) {
    return combineDateAndTime(episode.air_date, show.releaseTime);
  }

  const strategy = show.network ? platformStrategy[show.network] : undefined;
  const time = strategy ? strategies[strategy] : strategies.DEFAULT;

  return combineDateAndTime(episode.air_date, time);
}

export function combineDateAndTime(date: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid air date: ${date}`);
  }

  if (!/^\d{2}:\d{2}:\d{2}Z$/.test(time)) {
    throw new Error(`Invalid UTC time: ${time}`);
  }

  return normalizeIsoUtc(`${date}T${time}`);
}

export function normalizeIsoUtc(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid UTC timestamp: ${value}`);
  }

  return date.toISOString().replace(".000Z", "Z");
}
