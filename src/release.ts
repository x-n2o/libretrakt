import type { Episode, ReleaseStrategy, Show } from "./types.js";

export const strategies: Record<ReleaseStrategy, string> = {
  US_PRIMETIME: "02:00:00Z",
  GLOBAL_MIDNIGHT_PT: "07:00:00Z",
  GLOBAL_MIDNIGHT_ET: "05:00:00Z",
  DEFAULT: "00:00:00Z",
};

const strategyTimezone: Partial<Record<ReleaseStrategy, string>> = {
  GLOBAL_MIDNIGHT_PT: "America/Los_Angeles",
  GLOBAL_MIDNIGHT_ET: "America/New_York",
};

export const platformStrategy: Record<string, ReleaseStrategy> = {
  HBO: "US_PRIMETIME",
  "Apple TV": "GLOBAL_MIDNIGHT_PT",
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

  if (!strategy) {
    return combineDateAndTime(episode.air_date, strategies.DEFAULT);
  }

  const timezone = strategyTimezone[strategy];

  if (timezone) {
    return localMidnightToUtc(episode.air_date, timezone);
  }

  return combineDateAndTime(episode.air_date, strategies[strategy]);
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

function localMidnightToUtc(date: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid air date: ${date}`);
  }

  const [yearRaw, monthRaw, dayRaw] = date.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error(`Invalid air date: ${date}`);
  }

  const utcMidday = Date.UTC(year, month - 1, day, 12, 0, 0);
  const offsetMinutes = getTimezoneOffsetMinutes(utcMidday, timezone);
  const utcMillis = Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000;

  return normalizeIsoUtc(new Date(utcMillis).toISOString());
}

function getTimezoneOffsetMinutes(timestamp: number, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = dtf.formatToParts(new Date(timestamp));
  const partValue = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value;

    if (value === undefined) {
      throw new Error(`Missing ${type} while converting timezone ${timezone}`);
    }

    return Number(value);
  };

  const localAsUtc = Date.UTC(
    partValue("year"),
    partValue("month") - 1,
    partValue("day"),
    partValue("hour"),
    partValue("minute"),
    partValue("second"),
  );

  return (localAsUtc - timestamp) / (60 * 1000);
}
