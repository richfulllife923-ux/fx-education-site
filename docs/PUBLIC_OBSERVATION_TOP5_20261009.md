# Public observation Top5

The Owner ratified expanding the existing public observation page to up to five Japanese companies. Formal Research, its eligibility rules and its historical JEV judgments remain independent and unchanged.

The refresh button posts to `/api/stock-analysis/observation-refresh`. It reads the latest saved, hash-checked annual-fact input, rechecks the existing public eligibility conditions, reranks with the existing geometric calculation, and selects at most five companies. It does not fetch the full Universe. An unchanged input generation yields an identical run, ranking, score and update time. A new saved generation must include its actual update timestamp; request time is never substituted.

`GET /api/stock-analysis/observation-v2` reads the compact five-result projection. The legacy `GET /api/stock-analysis/observation` and its original three-result payload remain unchanged. Individual analysis APIs and the exact old-root 302 redirects are retained.

The public release gate requires matching external JEV PRE/POST receipts for this public input generation and projection. Missing, failed or mismatched review prevents reading or refreshing the Top5 result. This seal does not change Formal Research PRE/POST or confer Formal Eligibility. Local test seals are isolated and must never be published.

With zero eligible companies the page displays the empty-result message. One to four eligible companies render exactly that count. Five or more render the five highest existing scores. The score is an observation score, not a future price probability or a BUY/SELL signal. The page displays the saved update time in JST and does not expose calculation details.

Private saved input and review keys use the existing KV binding. The immutable full Research Run and original source files remain in their existing locations and are not copied into public projections.
