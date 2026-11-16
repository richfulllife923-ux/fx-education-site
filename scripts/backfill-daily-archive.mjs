import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Backfills past daily-analysis articles into the archive only.
// Each article is POSTed to /api/daily-analysis?archive_only=1, which stores an
// archive copy and index entry without touching the current (latest) article.
// Re-running is safe: an entry with the same date and publishedAt is reused.
//
// Required environment:
//   DAILY_ANALYSIS_PUBLISH_TOKEN  Bearer token for the publish endpoint.
// Optional environment:
//   SITE_URL                      Default: https://fx-education-site.pages.dev
//   DAILY_ANALYSIS_ARTICLES_DIR   Default: ../../../goals/tutto/files
//                                 (relative to this script)

const token = process.env.DAILY_ANALYSIS_PUBLISH_TOKEN;
const siteUrl = (process.env.SITE_URL ?? "https://fx-education-site.pages.dev").replace(/\/+$/, "");
const articlesDir =
  process.env.DAILY_ANALYSIS_ARTICLES_DIR ??
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../goals/tutto/files");

const ARTICLES = [
  ["HP_DAILY_ARTICLE_20261112.json", "2026-11-12T08:45:00+09:00"],
  ["HP_DAILY_ARTICLE_20261113.json", "2026-11-13T08:45:00+09:00"],
  ["HP_DAILY_ARTICLE_20261113_v2.json", "2026-11-13T19:00:00+09:00"],
  ["HP_DAILY_ARTICLE_20261114.json", "2026-11-14T08:45:00+09:00"],
  ["HP_DAILY_ARTICLE_20261114_v2.json", "2026-11-14T15:00:00+09:00"],
  ["HP_DAILY_ARTICLE_20261115.json", "2026-11-15T08:45:00+09:00"],
  ["HP_DAILY_ARTICLE_20261116.json", "2026-11-16T08:45:00+09:00"],
];

function stop(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

if (!token) {
  stop("Set DAILY_ANALYSIS_PUBLISH_TOKEN in the private environment.");
} else {
  const endpoint = `${siteUrl}/api/daily-analysis?archive_only=1`;
  let failed = 0;
  for (const [file, publishedAt] of ARTICLES) {
    try {
      const article = JSON.parse(await readFile(resolve(articlesDir, file), "utf8"));
      article.publishedAt = publishedAt;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(article),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.status !== "ready") {
        failed += 1;
        process.stderr.write(
          `FAILED ${file}: HTTP ${response.status}${result?.code ? ` (${result.code})` : ""}\n`,
        );
      } else {
        process.stdout.write(
          `Archived ${result.article.date}: ${result.article.companyName} (${result.article.ticker}) publishedAt=${result.article.publishedAt}\n`,
        );
      }
    } catch {
      failed += 1;
      process.stderr.write(`FAILED ${file}: could not read the file or reach the endpoint.\n`);
    }
  }
  if (failed > 0) {
    process.stderr.write(`${failed} of ${ARTICLES.length} articles failed.\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Done: ${ARTICLES.length} articles archived.\n`);
  }
}
