# LibreTrakt

[![GitHub repository](https://img.shields.io/badge/GitHub-x--n2o%2Flibretrakt-181717?logo=github&labelColor=555&logoColor=white)](https://github.com/x-n2o/libretrakt)
[![CI status](https://github.com/x-n2o/libretrakt/actions/workflows/ci.yml/badge.svg)](https://github.com/x-n2o/libretrakt/actions/workflows/ci.yml)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&labelColor=555&logoColor=white)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-deployed-F38020?logo=cloudflare&labelColor=555&logoColor=white)](https://libretrakt.pages.dev)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&labelColor=555&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10.33.2-F69220?logo=pnpm&labelColor=555&logoColor=white)
![TMDb](https://img.shields.io/badge/TMDb-powered-01B4E4?labelColor=555)
[![License: MIT](https://img.shields.io/badge/license-MIT-97CA00?labelColor=555)](LICENSE)

LibreTrakt generates live, subscribable iCalendar feeds for TV shows.

It is intentionally small: Cloudflare Pages Functions, TypeScript, TMDb, no database, no Trakt dependency, and no paid API. Calendar clients subscribe to normal `.ics` URLs and handle local timezone conversion themselves.

## Feeds

Starter catalog:

- Euphoria: `/api/cal/euphoria.ics`
- Your Friends & Neighbors: `/api/cal/your-friends-neighbors.ics`
- Margo's Got Money Troubles: `/api/cal/margos-got-money-troubles.ics`
- All starter shows: `/api/cal/all.ics`

The homepage exposes raw ICS, Apple Calendar, and Google Calendar links for each starter show and for the all-starter feed.

Any TMDb TV show can be used by ID:

```txt
/api/cal/tmdb-241609.ics
```

The homepage also includes a TMDb TV search box. Search results generate feed URLs on demand using the same `tmdb-<id>` format.

Custom bundles are stateless and deterministic:

```txt
/api/cal/all.ics?shows=euphoria,tmdb-241609,tmdb-245318
```

## How it works

LibreTrakt fetches TV metadata, seasons, and episodes from TMDb. It extracts season number, episode number, title, air date, and network, then emits UTC calendar events with a 30-minute alarm.

TMDb provides `air_date`, but not a release time. LibreTrakt resolves timestamps in this order:

1. Exact per-episode timestamp, when configured.
2. Per-show release-time override.
3. Platform strategy.
4. UTC midnight.

Built-in strategies:

```ts
US_PRIMETIME       = 21:00 America/New_York
GLOBAL_MIDNIGHT_PT = 00:00 America/Los_Angeles
GLOBAL_MIDNIGHT_ET = 00:00 America/New_York
DEFAULT            = 00:00:00Z
```

Local-time strategies are DST-aware: LibreTrakt resolves the IANA timezone offset for each episode's air date, so winter and summer episodes land on the right UTC moment.

Built-in platform mapping:

```ts
HBO -> US_PRIMETIME
Apple TV+ -> GLOBAL_MIDNIGHT_PT
Netflix -> GLOBAL_MIDNIGHT_PT
```

All event timestamps are UTC in `YYYY-MM-DDTHH:mm:ssZ` form. LibreTrakt does not use local timezones.

Generated feeds and search responses are cached at the Cloudflare edge with:

```txt
Cache-Control: public, max-age=1800
```

## Add a show

For a friendly URL, add a catalog entry in `src/shows.ts`:

```ts
{
  slug: "slow-horses",
  title: "Slow Horses",
  tmdbId: 95480,
  network: "Apple TV+",
}
```

For exact release overrides:

```ts
{
  slug: "example",
  title: "Example",
  tmdbId: 123,
  exactReleases: {
    "1x1": "2026-04-26T07:00:00Z"
  }
}
```

Without a catalog entry, use `/api/cal/tmdb-<id>.ics`.

## Subscribe

Apple Calendar accepts `webcal://` URLs. For example:

```txt
webcal://libretrakt.pages.dev/api/cal/euphoria.ics
```

Google Calendar accepts URL imports:

```txt
https://libretrakt.pages.dev/api/cal/euphoria.ics
```

The homepage's Google links use Google's `cid=webcal://...` subscribe flow and copy the HTTPS ICS URL to the clipboard. If Google opens an empty "From URL" form, paste the copied URL into the field.

## Develop

Install dependencies with pnpm:

```sh
pnpm install
```

Run checks:

```sh
pnpm test
pnpm run typecheck
pnpm run build
```

Run locally:

```sh
pnpm run dev
```

Create `.dev.vars` for local TMDb access:

```txt
TMDB_API_TOKEN=your_tmdb_read_access_token
```

An example file is included at `.dev.vars.example`. For local convenience, LibreTrakt also accepts `API_TOKEN`, `TMDB_API_KEY`, or `API_KEY`; production should use `TMDB_API_TOKEN`.

## Deploy to Cloudflare Pages

Create the Pages project:

```sh
pnpm run pages:create
```

Store the TMDb API Read Access Token as a Pages secret:

```sh
pnpm run secret:tmdb
```

Deploy:

```sh
pnpm run deploy
```

The production URL is:

```txt
https://libretrakt.pages.dev
```

## CI/CD

GitHub Actions runs tests, typechecking, and the production build on pull requests and pushes to `main`.

Pushes to `main` deploy to Cloudflare Pages after verification passes. The project is a Cloudflare Pages Direct Upload project, so deployment is handled by Wrangler from GitHub Actions rather than by Cloudflare's Git integration.

Required GitHub repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID for the Pages project.
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Account > Cloudflare Pages > Edit`.

The runtime `TMDB_API_TOKEN` remains configured as a Cloudflare Pages secret with `pnpm run secret:tmdb`; it is not needed by GitHub Actions.

## Philosophy

- Minimal
- Deterministic
- Location-agnostic
- Hackable
- Zero-cost to run
