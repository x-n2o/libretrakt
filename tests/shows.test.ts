import { describe, expect, it } from "vitest";
import { maxShowsPerFeed, parseShowRefs, resolveShowRef } from "../src/shows.js";

describe("show references", () => {
  it("resolves catalog slugs", () => {
    expect(resolveShowRef("euphoria")?.tmdbId).toBe(85552);
  });

  it("resolves arbitrary TMDb ID refs", () => {
    expect(resolveShowRef("tmdb-241609")).toMatchObject({
      slug: "tmdb-241609",
      tmdbId: 241609,
      source: "tmdb",
    });
  });

  it("rejects unknown plain slugs and invalid ids", () => {
    expect(resolveShowRef("unknown")).toBeNull();
    expect(resolveShowRef("tmdb-0")).toBeNull();
    expect(resolveShowRef("tmdb-nope")).toBeNull();
  });

  it("deduplicates bundle refs", () => {
    const shows = parseShowRefs("euphoria,euphoria,tmdb-241609");
    expect(shows).not.toBeInstanceOf(Error);
    expect(Array.isArray(shows) ? shows.map((show) => show.slug) : []).toEqual(["euphoria", "tmdb-241609"]);
  });

  it("limits bundle size", () => {
    const refs = Array.from({ length: maxShowsPerFeed + 1 }, (_, index) => `tmdb-${index + 1}`).join(",");
    expect(parseShowRefs(refs)).toBeInstanceOf(Error);
  });
});
