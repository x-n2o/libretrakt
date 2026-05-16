import type { Show, ShowConfig } from "./types.js";

export const catalogShows = [
  {
    slug: "euphoria",
    title: "Euphoria",
    tmdbId: 85552,
    network: "HBO",
  },
  {
    slug: "your-friends-neighbors",
    title: "Your Friends & Neighbors",
    tmdbId: 241609,
    network: "Apple TV+",
  },
  {
    slug: "margos-got-money-troubles",
    title: "Margo's Got Money Troubles",
    tmdbId: 245318,
    network: "Apple TV+",
  },
] satisfies ShowConfig[];

export const maxShowsPerFeed = 25;

const catalogBySlug = new Map(catalogShows.map((show) => [show.slug, show]));

export function listCatalogShows(): Show[] {
  return catalogShows.map((show) => ({ ...show, source: "catalog" }));
}

export function resolveShowRef(ref: string): Show | null {
  const normalized = normalizeRef(ref);
  const catalogShow = catalogBySlug.get(normalized);

  if (catalogShow) {
    return { ...catalogShow, source: "catalog" };
  }

  const tmdbMatch = /^tmdb-(\d+)$/.exec(normalized);

  if (!tmdbMatch) {
    return null;
  }

  const tmdbId = Number(tmdbMatch[1]);

  if (!Number.isSafeInteger(tmdbId) || tmdbId < 1) {
    return null;
  }

  return {
    slug: `tmdb-${tmdbId}`,
    title: `TMDb ${tmdbId}`,
    tmdbId,
    source: "tmdb",
  };
}

export function parseShowRefs(rawRefs: string | null): Show[] | Error {
  if (!rawRefs) {
    return listCatalogShows();
  }

  const refs = rawRefs
    .split(",")
    .map((ref) => normalizeRef(ref))
    .filter((ref) => ref.length > 0);

  if (refs.length === 0) {
    return new Error("At least one show reference is required.");
  }

  if (refs.length > maxShowsPerFeed) {
    return new Error(`A feed can include at most ${maxShowsPerFeed} shows.`);
  }

  const seen = new Set<string>();
  const shows: Show[] = [];

  for (const ref of refs) {
    if (seen.has(ref)) {
      continue;
    }

    const show = resolveShowRef(ref);

    if (!show) {
      return new Error(`Unknown show reference: ${ref}`);
    }

    seen.add(ref);
    shows.push(show);
  }

  return shows;
}

function normalizeRef(ref: string): string {
  return ref.trim().toLowerCase();
}
