// Isolated TEST DATA only; no provider requests and no production fixtures.
require("./register.cjs");
const fs = require("node:fs"), path = require("node:path"), http = require("node:http"), assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { selectFeatured } = require("../../lib/top3-selection.ts");
const { audit, run } = require("./top3-fixtures.cjs");
const { onRequest } = require("../../functions/api/stock-analysis/[[path]].ts");
const root = path.resolve(__dirname, "../.."), out = path.join(root, "out"), output = path.join(root, ".stock-test-output");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let file = path.resolve(out, "." + new URL(req.url, "http://local").pathname);
  if (!file.startsWith(out + path.sep)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
  res.end(fs.readFileSync(file));
});
(async () => {
  let browser; const results = [], errors = [], requests = [];
  try {
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const base = "http://127.0.0.1:" + server.address().port;
    browser = await chromium.launch({ headless: true, channel: "chrome" });
    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    page.on("pageerror", error => errors.push(error.message));
    let data = selectFeatured(run()), fail = false, delay = 0;
    await page.route("**/*", async route => {
      const u = new URL(route.request().url());
      if (u.pathname.startsWith("/api/stock-analysis/")) {
        requests.push(u.pathname);
        assert.equal(u.pathname, "/api/stock-analysis/featured", "Single selection endpoint only");
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        return route.fulfill({ status: fail ? 503 : 200, contentType: "application/json", body: JSON.stringify(data) });
      }
      return u.origin === base ? route.continue() : route.abort();
    });
    async function ready() {
      await page.waitForFunction(() => !document.querySelector('[data-featured-candidates] [role="status"]')?.textContent.includes("注目銘柄を確認しています"));
    }
    async function common(n) {
      const articles = page.locator("[data-featured-candidates] article");
      assert.equal(await articles.count(), n);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(await page.getByRole("heading", { name: "TUTTO 注目3銘柄", exact: true }).count(), 1);
      assert.equal(await page.getByText("TUTTO WATCHLIST", { exact: true }).count(), 1);
      assert.equal(await page.getByText("TUTTOが公開情報・業績・Cash Flow・事業変化などのEvidenceから、現在継続観測している3銘柄です。", { exact: true }).count(), 1);
      const nav = page.getByRole("navigation", { name: "株式分析メニュー", exact: true });
      assert.deepEqual(await nav.getByRole("link").allTextContents(), ["株式分析トップ →", "銘柄を入力して分析 →", "TUTTO 注目3銘柄 →", "銘柄を比較する →"]);
      const text = await page.locator("main").innerText();
      for (const raw of ["FACT", "CALCULATION", "CONFIRMED", "UNVERIFIED", "S100TEST", "snapshotId", "Universe", "管理者", "公開できる研究対象を準備中", "公開候補の確認状況"]) assert.ok(!text.includes(raw), "Default view exposes " + raw);
      for (const chip of ["AI", "Semiconductor", "Japan", "US", "Growth", "Value", "Cash Flow", "Turnaround"]) assert.equal(await page.getByText(chip, { exact: true }).count(), 0);
      const links = await page.locator("main a[href]").evaluateAll(a => a.map(e => e.href));
      assert.ok(links.every(u => !u.includes("/api/v2/documents/") && !u.toLowerCase().includes(".zip")));
      assert.equal(await page.getByRole("link", { name: "詳しく分析する", exact: true }).count(), n);
      assert.equal(await page.locator('[data-research-status="GRAY"]').count(), 0);
      if (n) {
        assert.deepEqual(await articles.evaluateAll(nodes => nodes.map(node => node.dataset.featuredSymbol)), data.entries.map(e => e.symbol));
        for (let i = 0; i < n; i++) {
          const card = articles.nth(i), entry = data.entries[i];
          assert.ok((await card.innerText()).includes("#" + (i + 1)));
          assert.ok((await card.innerText()).includes("業種：未取得"), "No inferred industry");
          assert.equal(await card.getByRole("heading", { name: "なぜ注目しているか", exact: true }).count(), 1);
          assert.equal(await card.getByRole("heading", { name: "主要Growth Evidence", exact: true }).count(), 1);
          assert.ok((await card.innerText()).includes(entry.researchStatus.publicLabel));
          const link = card.getByRole("link", { name: "詳しく分析する", exact: true });
          assert.equal(new URL(await link.getAttribute("href"), base).searchParams.get("symbol"), entry.symbol);
        }
        const box = await articles.first().boundingBox();
        assert.ok(box.y + 80 < page.viewportSize().height, "#1 must begin within the initial viewport");
        return box.y;
      }
      assert.equal(await page.locator("[data-featured-candidates] .card").count(), 0, "No empty card or invented slots");
    }
    for (const width of [375, 768, 1280]) for (const n of [0, 1, 2, 3]) {
      await page.setViewportSize({ width, height: width === 375 ? 667 : 900 });
      data = selectFeatured(run(Array.from({ length: n }, (_, i) => audit(String(1111 + i), i === 1 ? { valuation: "MISSING" } : {}))));
      const unchanged = JSON.stringify(data);
      await page.goto(base + "/stock-analysis/watchlist/", { waitUntil: "networkidle" }); await ready();
      const firstCardY = await common(n);
      assert.equal(JSON.stringify(data), unchanged);
      if (n === 3 && width === 375) {
        await page.screenshot({ path: path.join(output, "watchlist-TEST-DATA-375-initial.png") });
        await page.screenshot({ path: path.join(output, "watchlist-TEST-DATA-375-full.png"), fullPage: true });
      }
      if (n === 3 && width === 1280) await page.screenshot({ path: path.join(output, "watchlist-TEST-DATA-desktop.png"), fullPage: true });
      results.push({ testData: true, width, candidates: n, firstCardY, status: "PASS" });
    }
    await page.setViewportSize({ width: 375, height: 667 });
    for (const [state, patch] of [["IN_PROGRESS", { complete: false }], ["RECHECK_REQUIRED", { current: false }], ["COMPARISON_REQUIRED", {}]]) {
      data = selectFeatured(run(state === "COMPARISON_REQUIRED" ? [audit("1111"), audit("1112"), audit("1113"), audit("1114")] : [], patch));
      assert.equal(data.state, state);
      await page.goto(base + "/stock-analysis/watchlist/", { waitUntil: "networkidle" }); await ready(); await common(0);
      results.push({ testData: true, state, status: "PASS" });
    }
    data = selectFeatured(run([audit(), audit("1112", { valuation: "MISSING" })]));
    for (const suffix of ["", "?symbol=7203", "?symbol=285A"]) {
      const before = requests.length;
      await page.goto(base + "/stock-analysis/emerging-growth/" + suffix, { waitUntil: "networkidle" });
      await page.waitForURL(url => /^\/stock-analysis\/watchlist\/?$/.test(url.pathname) && !url.search); await ready(); await common(2);
      assert.equal(requests.length - before, 1, "Old URL loads the same result once");
      results.push({ testData: true, oldUrl: suffix, status: "PASS" });
    }
    // The static old URL keeps a usable fallback link when JavaScript is disabled.
    const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 375, height: 667 } });
    const response = await noJS.goto(base + "/stock-analysis/emerging-growth/");
    assert.equal(response.status(), 200);
    assert.equal(await noJS.getByRole("link", { name: "TUTTO 注目3銘柄を見る", exact: true }).getAttribute("href"), "/stock-analysis/watchlist/");
    await noJS.close(); results.push({ oldUrlNoJavaScript: true, status: "PASS" });
    fail = true;
    await page.goto(base + "/stock-analysis/watchlist/", { waitUntil: "networkidle" }); await ready(); await common(0);
    await page.getByRole("button", { name: "再確認", exact: true }).waitFor();
    fail = false; delay = 300;
    await page.getByRole("button", { name: "再確認", exact: true }).click();
    await page.getByText("注目銘柄を確認しています…", { exact: true }).waitFor();
    await ready(); await common(2); delay = 0; results.push({ testData: true, failureAndRetry: true, status: "PASS" });
    // Actual existing unconfigured API handler, not a simulated candidate list.
    const originalFetch = global.fetch; let outbound = 0;
    global.fetch = async () => { outbound++; throw Error("Unexpected outbound"); };
    try {
      const response = await onRequest({ request: new Request("https://tutto.test/api/stock-analysis/featured"), env: { STOCK_DATA_MODE: "FREE", STOCK_RATE_LIMITER: { limit: async () => ({ success: true }) } } });
      assert.equal(response.status, 200); data = await response.json();
      assert.equal(data.entries.length, 0); assert.equal(outbound, 0);
    } finally { global.fetch = originalFetch; }
    await page.goto(base + "/stock-analysis/watchlist/", { waitUntil: "networkidle" }); await ready(); await common(0);
    await page.screenshot({ path: path.join(output, "watchlist-local-no-candidates-375.png") });
    results.push({ unconfiguredExistingAPI: true, fabricatedCandidates: 0, status: "PASS" });
    await page.goto(base + "/stock-analysis/", { waitUntil: "networkidle" });
    assert.equal(await page.locator('main a[href*="emerging-growth"]').count(), 0);
    assert.equal(await page.getByRole("heading", { name: "成長企業発掘", exact: true }).count(), 0);
    results.push({ navigationConsolidated: true, status: "PASS" });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, "top3-browser-results.json"), JSON.stringify({ testedAt: new Date().toISOString(), results, errors, endpoints: [...new Set(requests)] }, null, 2));
    console.log(JSON.stringify({ cases: results.length, runtimeErrors: errors.length, status: "PASS" }));
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
