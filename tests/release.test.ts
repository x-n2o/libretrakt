import { describe, expect, it } from "vitest";
import { combineDateAndTime, resolveDateTime, resolveReleaseTimeZone } from "../src/release.js";
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
    expect(resolveDateTime(baseShow, { ...baseEpisode, exactRelease: "2026-04-26T10:15:00-04:00" })).toBe(
      "2026-04-26T10:15:00-04:00",
    );
  });

  it("uses show override before platform strategy", () => {
    expect(resolveDateTime({ ...baseShow, network: "Netflix", releaseTime: "02:00:00-04:00" }, baseEpisode)).toBe(
      "2026-04-26T02:00:00-04:00",
    );
  });

  it("uses platform strategy", () => {
    expect(resolveDateTime({ ...baseShow, network: "Apple TV+" }, baseEpisode)).toBe("2026-04-26T00:00:00");
  });

  it("uses the Apple TV strategy for TMDb's network label", () => {
    expect(resolveDateTime({ ...baseShow, network: "Apple TV" }, baseEpisode)).toBe("2026-04-26T00:00:00");
  });

  it("uses midnight without forcing UTC by default", () => {
    expect(resolveDateTime(baseShow, baseEpisode)).toBe("2026-04-26T00:00:00");
  });

  it("returns human-readable strategy time zones", () => {
    expect(resolveReleaseTimeZone({ ...baseShow, network: "Apple TV+" }, baseEpisode)).toBe("America/Los_Angeles");
    expect(resolveReleaseTimeZone({ ...baseShow, network: "HBO" }, baseEpisode)).toBe("America/New_York");
    expect(resolveReleaseTimeZone(baseShow, baseEpisode)).toBeUndefined();
  });

  it("validates dates and times", () => {
    expect(() => combineDateAndTime("2026-04", "00:00:00")).toThrow("Invalid air date");
    expect(() => combineDateAndTime("2026-04-26", "00:00")).toThrow("Invalid release time");
  });
});
