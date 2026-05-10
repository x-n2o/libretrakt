import { generateICS } from "./ics.js";
import { getShowEpisodes } from "./tmdb.js";
import type { Env, Show, ShowEpisode } from "./types.js";

export const cacheHeader = "public, max-age=3600";

export function textResponse(
  body: string,
  status = 200,
  headers: HeadersInit = {},
): Response {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": cacheHeader,
      ...headers,
    },
  });
}

export function htmlResponse(body: string, status = 200): Response {
  return textResponse(body, status, {
    "Content-Type": "text/html; charset=utf-8",
  });
}

export function jsonResponse(body: unknown, status = 200): Response {
  return textResponse(`${JSON.stringify(body, null, 2)}\n`, status, {
    "Content-Type": "application/json; charset=utf-8",
  });
}

export function calendarResponse(items: ShowEpisode[], name: string): Response {
  return textResponse(generateICS(items, name), 200, {
    "Content-Type": "text/calendar; charset=utf-8",
  });
}

export function errorResponse(message: string, status: number): Response {
  return textResponse(`${message}\n`, status, {
    "Content-Type": "text/plain; charset=utf-8",
  });
}

export async function loadEpisodes(env: Env, shows: Show[]): Promise<ShowEpisode[]> {
  const groups = await Promise.all(shows.map((show) => getShowEpisodes(env, show)));

  return groups
    .flat()
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.show.title.localeCompare(b.show.title));
}
