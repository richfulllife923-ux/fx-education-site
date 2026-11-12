import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Usage:
//   EARLY_DETECTION_SUBMIT_URL=https://fx-education-site.pages.dev/api/stock-analysis/early-detection-submit \
//   EARLY_DETECTION_SUBMIT_TOKEN=<secret> \
//   node scripts/submit-early-detection.mjs <submission.json> [preview|publish]
//
// The submission file holds an EarlyDetectionSubmission (schema
// "tutto-early-detection-submission/1"): the weekly detector run's findings
// with QUARTERLY MOMENTUM scores and a primary-source disclosure per entry.
// This path is independent of the CORE VALUE observation ranking and never
// writes to its keys. The token is read from the private environment and
// never printed.

const file = process.argv[2];
const mode = process.argv[3] ?? "preview";
const endpoint = process.env.EARLY_DETECTION_SUBMIT_URL;
const token = process.env.EARLY_DETECTION_SUBMIT_TOKEN;

function stop(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

if (!file || !["preview", "publish"].includes(mode)) {
  stop("Usage: node scripts/submit-early-detection.mjs <submission.json> [preview|publish]");
} else if (!endpoint || !token) {
  stop("Set EARLY_DETECTION_SUBMIT_URL and EARLY_DETECTION_SUBMIT_TOKEN in the private environment.");
} else {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    stop("EARLY_DETECTION_SUBMIT_URL is invalid.");
  }

  if (url && (
    url.origin !== "https://fx-education-site.pages.dev" ||
    url.pathname !== "/api/stock-analysis/early-detection-submit" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )) {
    stop("Submission is restricted to the official TUTTO early-detection-submit endpoint.");
  } else if (url) {
    try {
      const submission = JSON.parse(await readFile(resolve(file), "utf8"));
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          // Cloudflare Browser Integrity Check on pages.dev blocks the
          // default automated-client User-Agent (error 1010).
          "User-Agent": "TUTTO-Daily-Analysis-Publisher/1.0",
        },
        body: JSON.stringify({ mode, submission }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.projection) {
        stop(`Submission failed with HTTP ${response.status}${result?.code ? ` (${result.code})` : ""}.`);
      } else {
        const top = result.projection.entries.map((row) => `#${row.rank} ${row.name} (${row.code}) ${row.momentumScore}`).join("; ");
        process.stdout.write(`${mode === "publish" ? "Published" : "Preview"} ${result.projection.generated_at}: ${top}\n`);
      }
    } catch {
      stop("Submission failed. Check the submission file and endpoint availability.");
    }
  }
}
