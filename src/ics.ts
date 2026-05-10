import ical, { ICalAlarmType, ICalCalendarMethod } from "ical-generator";
import type { ShowEpisode } from "./types.js";

const defaultEventDurationMinutes = 30;

export function generateICS(items: ShowEpisode[], name = "LibreTrakt"): string {
  const calendar = ical({
    name,
    prodId: {
      company: "LibreTrakt",
      product: "LibreTrakt",
      language: "EN",
    },
  });

  calendar.method(ICalCalendarMethod.PUBLISH);

  for (const item of items) {
    const start = new Date(item.startsAt);
    const eventDurationMinutes = resolveEventDurationMinutes(item);
    const end = new Date(start.getTime() + eventDurationMinutes * 60 * 1000);

    const event = calendar.createEvent({
      id: eventId(item),
      start,
      end,
      timezone: item.timeZone ?? null,
      summary: eventSummary(item),
      description: eventDescription(item),
    });

    event.createAlarm({
      type: ICalAlarmType.display,
      trigger: 30 * 60,
      description: eventSummary(item),
    });
  }

  return calendar.toString();
}

export function eventSummary({ show, episode }: ShowEpisode): string {
  return `${show.title} S${pad(episode.season)}E${pad(episode.number)} – ${episode.title}`;
}

function eventDescription({ show, episode }: ShowEpisode): string {
  return `${show.title} season ${episode.season}, episode ${episode.number}.`;
}

function eventId({ show, episode }: ShowEpisode): string {
  return `${show.slug}-s${pad(episode.season)}e${pad(episode.number)}@libretrakt`;
}

function resolveEventDurationMinutes(item: ShowEpisode): number {
  const candidate = item.durationMinutes ?? item.episode.runtimeMinutes;

  if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
    const rounded = Math.round(candidate);

    if (rounded > 0) {
      return rounded;
    }
  }

  return defaultEventDurationMinutes;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
