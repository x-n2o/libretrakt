import { Router } from "itty-router";
import { withEdgeCache, type RuntimeContext } from "./cache.js";
import { homepage } from "./views.js";
import { calendarResponse, errorResponse, htmlResponse, jsonResponse, loadEpisodes } from "./http.js";
import { parseShowRefs, resolveShowRef } from "./shows.js";
import { searchShows } from "./tmdb.js";
import type { Env } from "./types.js";

type LibreRequest = Request & {
  params?: Record<string, string>;
};

const router = Router<LibreRequest>();

router.get("/", (request) => htmlResponse(homepage(new URL(request.url))));

router.get("/api/search", async (request, env: Env, context?: RuntimeContext) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return jsonResponse({ results: [] });
  }

  return withEdgeCache(request, context, async () => {
    try {
      const results = await searchShows(env, query);

      return jsonResponse({
        results: results.map((result) => ({
          id: result.id,
          title: result.name,
          firstAirDate: result.first_air_date ?? null,
          feed: `/api/cal/tmdb-${result.id}.ics`,
        })),
      });
    } catch (error) {
      return errorResponse(errorMessage(error), 502);
    }
  });
});

router.get("/api/cal/all.ics", async (request, env: Env, context?: RuntimeContext) => {
  return withEdgeCache(request, context, async () => {
    const url = new URL(request.url);
    const shows = parseShowRefs(url.searchParams.get("shows"));

    if (shows instanceof Error) {
      return errorResponse(shows.message, 400);
    }

    try {
      const episodes = await loadEpisodes(env, shows);
      return calendarResponse(episodes, "LibreTrakt");
    } catch (error) {
      return errorResponse(errorMessage(error), 502);
    }
  });
});

router.get("/api/cal/:slug", async (request, env: Env, context?: RuntimeContext) => {
  const slug = normalizeIcsSlug(request.params?.slug ?? "");

  if (!slug) {
    return errorResponse("Missing show slug.", 404);
  }

  if (slug === "all") {
    return router.fetch(new Request(new URL("/api/cal/all.ics", request.url), request), env);
  }

  const show = resolveShowRef(slug);

  if (!show) {
    return errorResponse(`Unknown show: ${slug}`, 404);
  }

  return withEdgeCache(request, context, async () => {
    try {
      const episodes = await loadEpisodes(env, [show]);
      return calendarResponse(episodes, show.title);
    } catch (error) {
      return errorResponse(errorMessage(error), 502);
    }
  });
});

router.all("*", () => errorResponse("Not found.", 404));

export function handleRequest(
  request: Request,
  env: Env,
  context?: RuntimeContext,
): Promise<Response> {
  if (request.method === "HEAD") {
    return router
      .fetch(asGetRequest(request) as LibreRequest, env, context)
      .then((response) => new Response(null, response));
  }

  return router.fetch(request as LibreRequest, env, context);
}

export function normalizeIcsSlug(value: string): string | null {
  if (!value.endsWith(".ics")) {
    return null;
  }

  return value.slice(0, -4).toLowerCase();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

function asGetRequest(request: Request): Request {
  return new Request(request.url, {
    headers: request.headers,
    method: "GET",
  });
}
