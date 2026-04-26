import { describe, expect, it } from "vitest";
import { eventSummary, generateICS } from "../src/ics.js";
import type { ShowEpisode } from "../src/types.js";

const item: ShowEpisode = {
  show: {
    slug: "euphoria",
    title: "Euphoria",
    tmdbId: 85552,
    network: "HBO",
    source: "catalog",
  },
  episode: {
    season: 1,
    number: 5,
    title: "03 Bonnie and Clyde",
    air_date: "2019-07-14",
  },
  startsAt: "2019-07-14T02:00:00Z",
};

describe("ics generation", () => {
  it("formats summaries", () => {
    expect(eventSummary(item)).toBe("Euphoria S01E05 – 03 Bonnie and Clyde");
  });

  it("uses episode runtime when available", () => {
    const output = generateICS([
      {
        ...item,
        episode: { ...item.episode, runtimeMinutes: 58 },
      },
    ]);

    expect(output).toContain("DTEND:20190714T025800Z");
  });

  it("creates calendar events with UTC start and alarm", () => {
    const output = generateICS([item], "Euphoria");

    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).toContain("BEGIN:VEVENT");
    expect(output).toContain("DTSTART:20190714T020000Z");
    expect(output).toContain("SUMMARY:Euphoria S01E05 – 03 Bonnie and Clyde");
    expect(output).toContain("DTEND:20190714T023000Z");
    expect(output).toContain("BEGIN:VALARM");
    expect(output).toContain("TRIGGER:-PT30M");
  });
});
