import { describe, expect, it } from "vitest";
import { combineDateAndTime, resolveDateTime } from "../src/release.js";
import type { Episode, Show } from "../src/types.js";

const baseShow: Show = {
  slug: "example",
  title: "Example",
  tmdbId: 1,
  source: "catalog",
};

const baseEpisode: Episode = {
  season: 1,
  number: 2,
  title: "Pilot",
  air_date: "2026-04-26",
};

describe("release time resolution", () => {
  it("uses exact release first", () => {
    expect(resolveDateTime(baseShow, { ...baseEpisode, exactRelease: "2026-04-26T10:15:00Z" })).toBe(
      "2026-04-26T10:15:00Z",
    );
  });

  it("uses show override before platform strategy", () => {
    expect(resolveDateTime({ ...baseShow, network: "Netflix", releaseTime: "02:00:00Z" }, baseEpisode)).toBe(
      "2026-04-26T02:00:00Z",
    );
  });

  it("uses platform strategy", () => {
    expect(resolveDateTime({ ...baseShow, network: "Apple TV+" }, baseEpisode)).toBe("2026-04-26T07:00:00Z");
  });

  it("uses UTC midnight by default", () => {
    expect(resolveDateTime(baseShow, baseEpisode)).toBe("2026-04-26T00:00:00Z");
  });

  it("validates dates and times", () => {
    expect(() => combineDateAndTime("2026-04", "00:00:00Z")).toThrow("Invalid air date");
    expect(() => combineDateAndTime("2026-04-26", "00:00")).toThrow("Invalid UTC time");
  });
});
