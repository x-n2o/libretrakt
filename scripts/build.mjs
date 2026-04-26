import { mkdir, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });

await writeFile(
  "dist/_routes.json",
  `${JSON.stringify({ version: 1, include: ["/*"], exclude: [] }, null, 2)}\n`,
);

await writeFile(
  "dist/404.html",
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>LibreTrakt</title>
  </head>
  <body>
    <h1>LibreTrakt</h1>
    <p>Not found.</p>
  </body>
</html>
`,
);
