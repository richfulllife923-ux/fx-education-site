import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const file = process.argv[2];
const endpoint = process.env.TUTTO_DAILY_ANALYSIS_URL;
const token = process.env.TUTTO_DAILY_ANALYSIS_TOKEN;

function stop(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

if (!file) {
  stop("Usage: node scripts/publish-daily-analysis.mjs <article.json>");
} else if (!endpoint || !token) {
  stop("Set TUTTO_DAILY_ANALYSIS_URL and TUTTO_DAILY_ANALYSIS_TOKEN in the private environment.");
} else {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    stop("TUTTO_DAILY_ANALYSIS_URL is invalid.");
  }

  if (url && (
    url.origin !== "https://fx-education-site.pages.dev" ||
    url.pathname !== "/api/daily-analysis" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )) {
    stop("Publishing is restricted to the official TUTTO daily-analysis endpoint.");
  } else if (url) {
    try {
      const content = await readFile(resolve(file), "utf8");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: content,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.status !== "ready") {
        stop(`Publishing failed with HTTP ${response.status}${result?.code ? ` (${result.code})` : ""}.`);
      } else {
        process.stdout.write(`Published ${result.article.date}: ${result.article.companyName} (${result.article.ticker}).\n`);
      }
    } catch {
      stop("Publishing failed. Check the article file and endpoint availability.");
    }
  }
}
