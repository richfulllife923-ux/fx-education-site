# Daily stock analysis publishing

This publishing path is limited to the existing daily-analysis slot on `/stock-analysis/watchlist/`. It does not grant repository access and does not change the Top5 selection, score, API, or Formal Research.

## How it works

- The page reads the latest article from `GET /api/daily-analysis`.
- Muse publishes one article at a time with `POST /api/daily-analysis` and a bearer token.
- The Functions route stores the article under the separate `daily-stock-analysis:published-v1` key in the existing `TOP3_RESEARCH_RUN` KV binding. Earlier articles are replaced; this is not an archive.
- The public response contains the article only. It never returns the publishing token.
- The article uses plain text fields rendered as React text, so submitted text is escaped. The API accepts HTTPS source links only.
- Missing storage or an invalid stored article fails closed. An older article date cannot overwrite a newer one; corrections for the same date are allowed.

## Configure the production secret

The source code does not contain a token. Before publishing, create a random token with at least 32 random bytes, then set it as the encrypted `DAILY_ANALYSIS_PUBLISH_TOKEN` secret for the production environment of the Cloudflare Pages project `fx-education-site`. Configure the same token in Muse's private secret store as `TUTTO_DAILY_ANALYSIS_TOKEN`, and set `TUTTO_DAILY_ANALYSIS_URL` to `https://fx-education-site.pages.dev/api/daily-analysis`.

Do not paste the token into source files, prompts, public chat, or commit history. Keep Preview credentials separate from Production credentials. Cloudflare documents Pages Function bindings and encrypted secrets in [Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/); a deployment is required after changing bindings or secrets.

This repository has not provisioned or changed Cloudflare settings. The endpoint returns `503 PUBLISHING_NOT_CONFIGURED` until the production secret and existing KV binding are available.

## Publish request

Muse sends JSON with this shape. Use only claims checked against cited primary material. Do not publish selection formulas, private evaluation notes, BUY/SELL instructions, or guaranteed-result language.

```json
{
  "schema": "tutto-daily-analysis/1",
  "date": "2026-11-12",
  "title": "2026年11月12日 ムービン・ストラテジック・キャリア（421A）：第3四半期決算を確認",
  "companyName": "ムービン・ストラテジック・キャリア",
  "ticker": "421A",
  "introduction": "対象期間と発表日を簡潔に説明します。",
  "sections": [
    {
      "heading": "今回確認したポイント（事実）",
      "paragraphs": ["一次資料で確認した内容を書きます。"],
      "points": []
    },
    {
      "heading": "事業上のリスク、反対仮説、見落としてはいけない点（見解）",
      "paragraphs": [],
      "points": ["確認が必要な反対仮説を書きます。"]
    }
  ],
  "sources": [
    {
      "label": "2026年12月期 第3四半期決算短信（2026年11月11日公表）",
      "url": "https://www2.jpx.co.jp/disc/421A0/140120261111573133.pdf"
    }
  ]
}
```

Send it as `Content-Type: application/json` with `Authorization: Bearer <TUTTO_DAILY_ANALYSIS_TOKEN>`. A successful request returns `201` and the saved public article. Missing/incorrect authorization returns `401`; invalid content returns `400`; an older date returns `409`; unconfigured storage or secret returns `503`.

For Muse's shell-based workflow, save the JSON payload to a temporary file outside the repository and run:

```text
node scripts/publish-daily-analysis.mjs <path-to-article.json>
```

The script reads `TUTTO_DAILY_ANALYSIS_URL` and `TUTTO_DAILY_ANALYSIS_TOKEN` from Muse's private environment, sends the file over HTTPS only to the official endpoint, and never prints the token or request body. If Muse cannot run this script or make authenticated HTTPS requests, its environment still needs an HTTP action/tool configured before it can publish.

Only the `date`, title, company, ticker, introduction, sections, and HTTPS sources are supplied by Muse. `publishedAt` is assigned by the server. Requests are limited to 24 KiB, up to 10 sections, and up to 8 sources.

## Responsibility boundary

The endpoint validates structure, dates, size, and URL protocol. It does not validate financial facts or determine which company should be analyzed. Muse remains responsible for checking each article against its cited primary documents before publishing.
