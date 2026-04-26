import { describe, expect, it, vi } from "vitest";
import { handleRequest } from "../src/router.js";
import type { Env } from "../src/types.js";

const env: Env = {
  TMDB_API_TOKEN: "token",
};

describe("router", () => {
  it("serves the homepage", async () => {
    const response = await handleRequest(new Request("https://libretrakt.pages.dev/"), env);
    const body = await response.text();

    expect(response.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("LibreTrakt");
    expect(body).toContain("/api/cal/euphoria.ics");
  });

  it("serves HEAD requests with matching headers and no body", async () => {
    const response = await handleRequest(new Request("https://libretrakt.pages.dev/", { method: "HEAD" }), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toBe("");
  });

  it("404s unknown slugs", async () => {
    const response = await handleRequest(new Request("https://libretrakt.pages.dev/api/cal/nope.ics"), env);

    expect(response.status).toBe(404);
  });

  it("400s invalid bundles", async () => {
    const response = await handleRequest(
      new Request("https://libretrakt.pages.dev/api/cal/all.ics?shows=nope"),
      env,
    );

    expect(response.status).toBe(400);
  });

  it("sets calendar headers", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes("/tv/85552/season/1")) {
        return Response.json({
          season_number: 1,
          episodes: [{ episode_number: 1, name: "Pilot", air_date: "2026-04-26" }],
        });
      }

      return Response.json({
        id: 85552,
        name: "Euphoria",
        networks: [{ id: 49, name: "HBO" }],
        seasons: [{ season_number: 1 }],
      });
    });

    const response = await handleRequest(new Request("https://libretrakt.pages.dev/api/cal/euphoria.ics"), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
    expect(response.headers.get("cache-control")).toBe("public, max-age=1800");
    expect(await response.text()).toContain("SUMMARY:Euphoria S01E01 – Pilot");

    fetchSpy.mockRestore();
  });

  it("serves calendar HEAD requests without a body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes("/tv/85552/season/1")) {
        return Response.json({
          season_number: 1,
          episodes: [{ episode_number: 1, name: "Pilot", air_date: "2026-04-26" }],
        });
      }

      return Response.json({
        id: 85552,
        name: "Euphoria",
        networks: [{ id: 49, name: "HBO" }],
        seasons: [{ season_number: 1 }],
      });
    });

    const response = await handleRequest(
      new Request("https://libretrakt.pages.dev/api/cal/euphoria.ics", { method: "HEAD" }),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
    expect(await response.text()).toBe("");

    fetchSpy.mockRestore();
  });

  it("searches shows and returns feed links", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        results: [{ id: 241609, name: "Your Friends & Neighbors", first_air_date: "2025-04-10" }],
      }),
    );

    const response = await handleRequest(
      new Request("https://libretrakt.pages.dev/api/search?q=friends"),
      env,
    );
    const payload = (await response.json()) as {
      results: Array<{ id: number; title: string; feed: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.results[0]).toMatchObject({
      id: 241609,
      title: "Your Friends & Neighbors",
      feed: "/api/cal/tmdb-241609.ics",
    });

    fetchSpy.mockRestore();
  });
});
