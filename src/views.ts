import { listCatalogShows } from "./shows.js";

export function homepage(url: URL): string {
  const origin = url.origin;
  const githubUrl = "https://github.com/x-n2o/libretrakt";
  const rows = listCatalogShows()
    .map((show) => {
      const feedUrl = `${origin}/api/cal/${show.slug}.ics`;

      return `<li>
        <strong>${escapeHtml(show.title)}</strong>
        ${feedLinks(feedUrl)}
      </li>`;
    })
    .join("");

  const allUrl = `${origin}/api/cal/all.ics`;
  const tmdbExample = `${origin}/api/cal/tmdb-241609.ics`;
  const bundleExample = `${origin}/api/cal/all.ics?shows=euphoria,tmdb-241609,tmdb-245318`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>LibreTrakt</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }

      body {
        margin: 0;
        background: Canvas;
        color: CanvasText;
      }

      main {
        width: min(760px, calc(100% - 32px));
        margin: 0 auto;
        padding: 56px 0;
      }

      h1 {
        margin: 0 0 12px;
        font-size: 2.4rem;
      }

      p {
        max-width: 64ch;
      }

      ul {
        padding-left: 1.2rem;
      }

      li {
        margin: 10px 0;
      }

      a {
        margin-left: 10px;
      }

      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 18px 0 28px;
      }

      .badges a {
        line-height: 1;
        margin-left: 0;
      }

      .badges img {
        display: block;
        height: 20px;
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }

      .examples {
        margin-top: 32px;
      }

      form {
        display: flex;
        gap: 8px;
        margin: 28px 0 12px;
      }

      input {
        flex: 1;
        min-width: 0;
        padding: 10px 12px;
        font: inherit;
      }

      button {
        padding: 10px 14px;
        font: inherit;
        cursor: pointer;
      }

      .result-title {
        display: inline-block;
        min-width: 220px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>LibreTrakt</h1>
      <p>Live, subscribable iCalendar feeds for TV shows. No Trakt dependency, no database, no paid APIs, UTC-only.</p>
      <div class="badges" aria-label="Project badge">
        <a href="${githubUrl}" target="_blank" rel="noopener">
          <img alt="GitHub repository" src="https://img.shields.io/badge/GitHub-x--n2o%2Flibretrakt-181717?logo=github&amp;labelColor=555&amp;logoColor=white">
        </a>
      </div>
      <h2>Find a show</h2>
      <form id="search-form">
        <input id="search-input" name="q" type="search" minlength="2" placeholder="Search TMDb TV shows" required>
        <button type="submit">Search</button>
      </form>
      <ul id="search-results"></ul>
      <h2>Starter feeds</h2>
      <ul>${rows}</ul>
      <p><strong>All starter shows:</strong> ${feedLinks(allUrl)}</p>
      <section class="examples">
        <h2>Any TMDb TV show</h2>
        <p>Use <code>/api/cal/tmdb-&lt;id&gt;.ics</code> for any TMDb TV series ID.</p>
        <p><a href="${tmdbExample}">${tmdbExample}</a></p>
        <h2>Custom bundles</h2>
        <p>Combine catalog slugs and TMDb IDs with <code>?shows=</code>.</p>
        <p><a href="${bundleExample}">${bundleExample}</a></p>
      </section>
    </main>
    <script>
      const form = document.querySelector("#search-form");
      const input = document.querySelector("#search-input");
      const results = document.querySelector("#search-results");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const query = input.value.trim();

        if (query.length < 2) return;

        results.textContent = "Searching...";

        try {
          const response = await fetch("/api/search?q=" + encodeURIComponent(query));
          const payload = await response.json();

          results.textContent = "";

          for (const show of payload.results || []) {
            const feedUrl = new URL(show.feed, window.location.origin).href;
            const appleUrl = feedUrl.replace(/^https:\\/\\//, "webcal://");
            const googleUrl = "https://calendar.google.com/calendar/u/0/r?cid=" + encodeURIComponent(appleUrl);
            const item = document.createElement("li");
            item.innerHTML =
              '<span class="result-title"></span>' +
              '<a>ICS</a>' +
              '<a>Apple</a>' +
              '<a target="_blank" rel="noopener">Google</a>';
            item.querySelector(".result-title").textContent =
              show.title + (show.firstAirDate ? " (" + show.firstAirDate.slice(0, 4) + ")" : "");
            const links = item.querySelectorAll("a");
            links[0].href = feedUrl;
            links[1].href = appleUrl;
            links[2].href = googleUrl;
            links[2].dataset.copyUrl = feedUrl;
            results.append(item);
          }

          if (!results.children.length) {
            results.textContent = "No shows found.";
          }
        } catch {
          results.textContent = "Search failed.";
        }
      });

      document.addEventListener("click", (event) => {
        const link = event.target.closest("a[data-copy-url]");

        if (!link || !navigator.clipboard) return;

        navigator.clipboard.writeText(link.dataset.copyUrl).catch(() => {});
      });
    </script>
  </body>
</html>`;
}

function feedLinks(feedUrl: string): string {
  const appleUrl = feedUrl.replace(/^https:\/\//, "webcal://");
  const googleUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(appleUrl)}`;

  return `<a href="${feedUrl}">ICS</a>
        <a href="${appleUrl}">Apple</a>
        <a href="${googleUrl}" target="_blank" rel="noopener" data-copy-url="${feedUrl}">Google</a>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
