import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Usage:
//   OBSERVATION_SUBMIT_URL=https://fx-education-site.pages.dev/api/stock-analysis/observation-submit \
//   OBSERVATION_SUBMIT_TOKEN=<secret> \
//   node scripts/submit-observation.mjs <input.json> [preview|publish]
//
// The input file holds an ObservationInput in the existing sealed format
// (schema "tutto-public-observation-input/1"). The server computes the
// ranking with the existing model; this script never sends ranks or scores.
// The token is read from the private environment and never printed.

const file = process.argv[2];
const mode = process.argv[3] ?? "preview";
const endpoint = process.env.OBSERVATION_SUBMIT_URL;
const token = process.env.OBSERVATION_SUBMIT_TOKEN;

function stop(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

if (!file || !["preview", "publish"].includes(mode)) {
  stop("Usage: node scripts/submit-observation.mjs <input.json> [preview|publish]");
} else if (!endpoint || !token) {
  stop("Set OBSERVATION_SUBMIT_URL and OBSERVATION_SUBMIT_TOKEN in the private environment.");
} else {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    stop("OBSERVATION_SUBMIT_URL is invalid.");
  }

  if (url && (
    url.origin !== "https://fx-education-site.pages.dev" ||
    url.pathname !== "/api/stock-analysis/observation-submit" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )) {
    stop("Submission is restricted to the official TUTTO observation-submit endpoint.");
  } else if (url) {
    try {
      const input = JSON.parse(await readFile(resolve(file), "utf8"));
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          // Cloudflare Browser Integrity Check on pages.dev blocks the
          // default automated-client User-Agent (error 1010).
          "User-Agent": "TUTTO-Daily-Analysis-Publisher/1.0",
        },
        body: JSON.stringify({ mode, input }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.projection) {
        stop(`Submission failed with HTTP ${response.status}${result?.code ? ` (${result.code})` : ""}.`);
      } else {
        const top = result.projection.top5.map((row) => `#${row.rank} ${row.name} (${row.code}) ${row.score}`).join("; ");
        process.stdout.write(`${mode === "publish" ? "Published" : "Preview"} ${result.projection.generated_at}: ${top}\n`);
      }
    } catch {
      stop("Submission failed. Check the input file and endpoint availability.");
    }
  }
}
