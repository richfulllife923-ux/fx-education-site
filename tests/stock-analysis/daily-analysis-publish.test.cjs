require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { onRequest } = require('../../functions/api/daily-analysis.ts');
const { DAILY_ANALYSIS_SCHEMA } = require('../../lib/daily-analysis-content.ts');

const KEY = 'daily-stock-analysis:published-v1';
const TOKEN = 'a'.repeat(64);
const todayJst = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

function article(date = todayJst) {
  return {
    schema: DAILY_ANALYSIS_SCHEMA,
    date,
    title: '本日の企業分析',
    companyName: 'テスト企業',
    ticker: '421A',
    introduction: '一次資料を確認しました。',
    sections: [{ heading: '確認事項', paragraphs: ['開示内容です。'], points: ['観測項目です。'] }],
    sources: [{ label: '公式資料', url: 'https://www2.jpx.co.jp/disc/test.pdf' }],
  };
}

function store(initial = null) {
  const values = new Map(initial ? [[KEY, initial]] : []);
  const writes = [];
  return {
    values,
    writes,
    get: async (key) => values.get(key) ?? null,
    put: async (key, value) => { writes.push(key); values.set(key, JSON.parse(value)); },
  };
}

function request(method, body, { token = TOKEN, origin = 'https://tutto.test', contentType = 'application/json' } = {}) {
  const headers = new Headers({ 'Content-Type': contentType });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (origin) headers.set('Origin', origin);
  return new Request('https://tutto.test/api/daily-analysis', {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('public GET returns empty before first publication, then reads only the daily article key', async () => {
  const backing = store();
  let response = await onRequest({ request: request('GET', undefined, { token: null }), env: { TOP3_RESEARCH_RUN: backing } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'empty' });
  response = await onRequest({ request: request('POST', article()), env: { TOP3_RESEARCH_RUN: backing, DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN } });
  assert.equal(response.status, 201);
  assert.deepEqual(backing.writes, [KEY]);
  response = await onRequest({ request: request('GET', undefined, { token: null }), env: { TOP3_RESEARCH_RUN: backing } });
  const published = await response.json();
  assert.equal(response.status, 200);
  assert.equal(published.article.title, '本日の企業分析');
  assert.ok(!JSON.stringify(published).includes(TOKEN));
});

test('publishing requires a long bearer token, same-site origin when supplied, and a configured store', async () => {
  const backing = store();
  const env = { TOP3_RESEARCH_RUN: backing, DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN };
  assert.equal((await onRequest({ request: request('POST', article(), { token: null }), env })).status, 401);
  assert.equal((await onRequest({ request: request('POST', article(), { token: 'wrong'.repeat(10) }), env })).status, 401);
  assert.equal((await onRequest({ request: request('POST', article(), { origin: 'https://attacker.test' }), env })).status, 403);
  assert.equal((await onRequest({ request: request('POST', article()), env: { DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN } })).status, 503);
  assert.equal((await onRequest({ request: request('POST', article()), env: { TOP3_RESEARCH_RUN: backing, DAILY_ANALYSIS_PUBLISH_TOKEN: 'short' } })).status, 503);
  assert.equal(backing.writes.length, 0);
});

test('invalid schemas and non-HTTPS sources are rejected without writing', async () => {
  const backing = store();
  const env = { TOP3_RESEARCH_RUN: backing, DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN };
  for (const change of [
    (value) => { value.schema = 'unknown'; },
    (value) => { value.sources[0].url = 'javascript:alert(1)'; },
    (value) => { value.ticker = 'not a ticker'; },
    (value) => { value.sections = []; },
    (value) => { value.date = '2999-01-01'; },
  ]) {
    const invalid = article();
    change(invalid);
    const response = await onRequest({ request: request('POST', invalid), env });
    assert.equal(response.status, 400);
  }
  assert.equal((await onRequest({ request: request('POST', article(), { contentType: 'text/plain' }), env })).status, 415);
  assert.equal(backing.writes.length, 0);
});

test('older article dates cannot replace the current entry, while same-day corrections can', async () => {
  const current = { ...article(), publishedAt: new Date().toISOString() };
  const backing = store(current);
  const env = { TOP3_RESEARCH_RUN: backing, DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN };
  const old = article('2000-01-01');
  assert.equal((await onRequest({ request: request('POST', old), env })).status, 409);
  assert.equal((await onRequest({ request: request('POST', { ...article(), title: '訂正版' }), env })).status, 201);
  assert.equal(backing.values.get(KEY).title, '訂正版');
  assert.equal(backing.writes.length, 1);
});

test('corrupt stored content is not silently replaced by a new publish', async () => {
  const backing = store({ schema: 'corrupt' });
  const env = { TOP3_RESEARCH_RUN: backing, DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN };
  const response = await onRequest({ request: request('POST', article()), env });
  assert.equal(response.status, 503);
  assert.equal(backing.writes.length, 0);
});

test('unsupported methods, oversized bodies, and storage failures fail closed', async () => {
  const backing = store();
  const env = { TOP3_RESEARCH_RUN: backing, DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN };
  assert.equal((await onRequest({ request: request('DELETE'), env })).status, 405);
  const huge = { ...article(), introduction: 'あ'.repeat(30000) };
  assert.equal((await onRequest({ request: request('POST', huge), env })).status, 400);
  const failed = { get: async () => { throw Error('storage failure'); }, put: async () => { throw Error('storage failure'); } };
  assert.equal((await onRequest({ request: request('GET', undefined, { token: null }), env: { TOP3_RESEARCH_RUN: failed } })).status, 503);
  assert.equal((await onRequest({ request: request('POST', article()), env: { TOP3_RESEARCH_RUN: failed, DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN } })).status, 503);
});
