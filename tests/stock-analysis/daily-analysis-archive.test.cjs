require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { onRequest } = require('../../functions/api/daily-analysis.ts');
const { DAILY_ANALYSIS_SCHEMA } = require('../../lib/daily-analysis-content.ts');

const KEY = 'daily-stock-analysis:published-v1';
const INDEX_KEY = 'daily-stock-analysis:archive-index-v1';
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

function store(initial = {}) {
  const values = new Map(Object.entries(initial));
  const writes = [];
  return {
    values,
    writes,
    get: async (key) => values.get(key) ?? null,
    put: async (key, value) => { writes.push(key); values.set(key, JSON.parse(value)); },
  };
}

function request(method, body, { token = TOKEN, path = '/api/daily-analysis' } = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json', Origin: 'https://tutto.test' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return new Request(`https://tutto.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function env(backing) {
  return { TOP3_RESEARCH_RUN: backing, DAILY_ANALYSIS_PUBLISH_TOKEN: TOKEN };
}

test('a normal publish also archives a copy and lists it in the index', async () => {
  const backing = store();
  const response = await onRequest({ request: request('POST', article()), env: env(backing) });
  assert.equal(response.status, 201);

  const listResponse = await onRequest({ request: request('GET', undefined, { token: null, path: '/api/daily-analysis?archive=1' }), env: env(backing) });
  assert.equal(listResponse.status, 200);
  const list = await listResponse.json();
  assert.equal(list.status, 'ready');
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].id, todayJst);
  assert.equal(list.items[0].date, todayJst);
  assert.equal(list.items[0].companyName, 'テスト企業');

  const itemResponse = await onRequest({ request: request('GET', undefined, { token: null, path: `/api/daily-analysis?id=${todayJst}` }), env: env(backing) });
  const item = await itemResponse.json();
  assert.equal(item.status, 'ready');
  assert.equal(item.article.title, '本日の企業分析');

  const latestResponse = await onRequest({ request: request('GET', undefined, { token: null }), env: env(backing) });
  const latest = await latestResponse.json();
  assert.equal(latest.status, 'ready');
  assert.equal(latest.article.date, todayJst);
});

test('a second article on the same date gets a suffixed archive id and the index stays newest-first', async () => {
  const backing = store();
  const past = { ...article('2026-01-05'), publishedAt: '2026-01-05T08:45:00+09:00' };
  assert.equal((await onRequest({ request: request('POST', past, { path: '/api/daily-analysis?archive_only=1' }), env: env(backing) })).status, 201);
  assert.equal((await onRequest({ request: request('POST', article('2026-01-05')), env: env(backing) })).status, 201);

  const list = await (await onRequest({ request: request('GET', undefined, { token: null, path: '/api/daily-analysis?archive=1' }), env: env(backing) })).json();
  assert.deepEqual(list.items.map((item) => item.id), ['2026-01-05-2', '2026-01-05']);

  const second = await (await onRequest({ request: request('GET', undefined, { token: null, path: '/api/daily-analysis?id=2026-01-05-2' }), env: env(backing) })).json();
  assert.equal(second.status, 'ready');
  assert.equal(second.article.date, '2026-01-05');
});

test('archive_only backfill never touches the current article and ignores the older-article check', async () => {
  const current = { ...article(), publishedAt: new Date().toISOString() };
  const backing = store({ [KEY]: current });
  const past = { ...article('2000-01-01'), publishedAt: '2000-01-01T08:45:00+09:00' };
  const response = await onRequest({ request: request('POST', past, { path: '/api/daily-analysis?archive_only=1' }), env: env(backing) });
  assert.equal(response.status, 201);
  const published = await response.json();
  assert.equal(published.article.publishedAt, '2000-01-01T08:45:00+09:00');
  assert.ok(!backing.writes.includes(KEY));
  assert.deepEqual(backing.values.get(KEY), current);

  const latest = await (await onRequest({ request: request('GET', undefined, { token: null }), env: env(backing) })).json();
  assert.equal(latest.article.date, todayJst);
});

test('reposting the same archive_only article does not duplicate the index entry', async () => {
  const backing = store();
  const past = { ...article('2026-01-05'), publishedAt: '2026-01-05T08:45:00+09:00' };
  for (let count = 0; count < 2; count += 1) {
    assert.equal((await onRequest({ request: request('POST', past, { path: '/api/daily-analysis?archive_only=1' }), env: env(backing) })).status, 201);
  }
  const index = backing.values.get(INDEX_KEY);
  assert.equal(index.length, 1);
  assert.equal(index[0].id, '2026-01-05');
});

test('archive_only falls back to the current time when publishedAt is missing or invalid', async () => {
  const backing = store();
  const before = Date.now();
  const missing = await (await onRequest({ request: request('POST', article('2026-01-05'), { path: '/api/daily-analysis?archive_only=1' }), env: env(backing) })).json();
  const invalid = await (await onRequest({ request: request('POST', { ...article('2026-01-06'), publishedAt: 'not-a-date' }, { path: '/api/daily-analysis?archive_only=1' }), env: env(backing) })).json();
  for (const result of [missing, invalid]) {
    const parsed = Date.parse(result.article.publishedAt);
    assert.ok(Number.isFinite(parsed) && parsed >= before - 1000 && parsed <= Date.now() + 1000);
  }
});

test('archive reads report empty for missing entries and malformed ids', async () => {
  const backing = store();
  assert.deepEqual(
    await (await onRequest({ request: request('GET', undefined, { token: null, path: '/api/daily-analysis?archive=1' }), env: env(backing) })).json(),
    { status: 'empty' },
  );
  assert.deepEqual(
    await (await onRequest({ request: request('GET', undefined, { token: null, path: '/api/daily-analysis?id=2026-01-05' }), env: env(backing) })).json(),
    { status: 'empty' },
  );
  assert.deepEqual(
    await (await onRequest({ request: request('GET', undefined, { token: null, path: '/api/daily-analysis?id=../../etc' }), env: env(backing) })).json(),
    { status: 'empty' },
  );
});

test('archive_only still requires authentication and a valid article', async () => {
  const backing = store();
  assert.equal((await onRequest({ request: request('POST', article(), { token: null, path: '/api/daily-analysis?archive_only=1' }), env: env(backing) })).status, 401);
  assert.equal((await onRequest({ request: request('POST', { ...article(), schema: 'unknown' }, { path: '/api/daily-analysis?archive_only=1' }), env: env(backing) })).status, 400);
  assert.equal(backing.writes.length, 0);
});
