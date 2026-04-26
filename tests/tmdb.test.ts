import { describe, expect, it, vi } from "vitest";
import { getShowEpisodes, searchShows } from "../src/tmdb.js";
import type { Env, Show } from "../src/types.js";

const env: Env = {
  TMDB_API_TOKEN: "token",
};

const show: Show = {
  slug: "example",
  title: "Example",
  tmdbId: 123,
  network: "Apple TV+",
  source: "catalog",
};

describe("tmdb client", () => {
  it("maps seasons and episodes", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes("/tv/123/season/1")) {
        return Response.json({
          season_number: 1,
          episodes: [
            { episode_number: 1, name: "First", air_date: "2026-04-24" },
            { episode_number: 2, name: "No date", air_date: null },
          ],
        });
      }

      return Response.json({
        id: 123,
        name: "Example From TMDb",
        networks: [{ id: 1, name: "Apple TV+" }],
        seasons: [{ season_number: 0 }, { season_number: 1 }],
      });
    });

    const episodes = await getShowEpisodes(env, show, fetcher as typeof fetch);

    expect(episodes).toHaveLength(1);
    expect(episodes[0]).toMatchObject({
      show: { title: "Example From TMDb", network: "Apple TV+" },
      episode: { season: 1, number: 1, title: "First", air_date: "2026-04-24" },
      startsAt: "2026-04-24T07:00:00Z",
    });
  });

  it("searches TV shows", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        results: [{ id: 241609, name: "Your Friends & Neighbors", first_air_date: "2025-04-10" }],
      }),
    );

    const results = await searchShows(env, "friends", fetcher as typeof fetch);

    expect(results[0]).toMatchObject({ id: 241609, name: "Your Friends & Neighbors" });
  });

  it("can use a TMDb API key when no bearer token is configured", async () => {
    let requestedUrl = "";
    const fetcher: typeof fetch = async (input) => {
      requestedUrl = input.toString();
      return Response.json({ results: [] });
    };

    await searchShows({ API_KEY: "key" }, "friends", fetcher);

    expect(requestedUrl).toContain("api_key=key");
  });
});
