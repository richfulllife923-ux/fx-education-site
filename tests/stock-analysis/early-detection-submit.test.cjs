require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { onRequest } = require('../../functions/api/stock-analysis/early-detection-submit.ts');
const {
  buildEarlyDetectionProjection, previewEarlyDetectionSubmission,
  publishEarlyDetectionSubmission, readEarlyDetection,
} = require('../../server/stock-analysis/early-detection.ts');
const {
  EARLY_DETECTION_KEY, EARLY_DETECTION_CLAUDE_SUBMISSION_KEY,
  EARLY_DETECTION_MODEL, earlyDetectionDigest,
} = require('../../lib/early-detection.ts');

const TOKEN = 'e'.repeat(64);

async function submission(n = 3) {
  const entries = Array.from({ length: n }, (_, i) => ({
    rank: i + 1,
    code: i === 2 ? 'AAPL' : String(1000 + i),
    name: i === 2 ? 'Apple Inc.' : 'テスト企業' + i,
    market: i === 2 ? 'US' : 'JP',
    momentumScore: 90 - i * 10,
    dataCoverage: 100 - i * 10,
    classification: 'MOMENTUM_UP',
    judgment: i === 0 ? 'STRONG_EARLY_CANDIDATE' : 'EARLY_CANDIDATE',
    headline: '営業利益が前年同期比で大きく伸び、通期予想を上方修正した。',
    source: {
      label: 'テスト企業 決算短信',
      url: 'https://example.com/disclosure/' + i,
      publishedDate: '2026-11-10',
      period: '2027年3月期 第2四半期',
    },
  }));
  const s = {
    schema: 'tutto-early-detection-submission/1', model: EARLY_DETECTION_MODEL,
    updated_at: '2026-11-13T00:00:00.000Z', data_observed_at: '2026-11-12T00:00:00.000Z',
    entries, entries_sha256: '',
  };
  s.entries_sha256 = await earlyDetectionDigest(entries);
  return s;
}

function store(initial = []) {
  const values = new Map(initial);
  const writes = [];
  return {
    values, writes,
    get: async (key) => values.get(key) ?? null,
    put: async (key, value) => { writes.push(key); values.set(key, JSON.parse(value)); },
  };
}

function request(body, { token = TOKEN, method = 'POST', origin = 'https://tutto.test' } = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (origin) headers.set('Origin', origin);
  return new Request('https://tutto.test/api/stock-analysis/early-detection-submit', {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('preview validates and stores nothing', async () => {
  const s = await submission();
  const backing = store();
  const response = await onRequest({
    request: request({ mode: 'preview', submission: s }),
    env: { TOP3_RESEARCH_RUN: backing, EARLY_DETECTION_SUBMIT_TOKEN: TOKEN },
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.status, 'preview');
  assert.deepEqual(result.projection, await buildEarlyDetectionProjection(s));
  assert.equal(backing.writes.length, 0);
});

test('publish stores submission and projection; read serves it back', async () => {
  const s = await submission();
  const backing = store();
  const response = await onRequest({
    request: request({ mode: 'publish', submission: s }),
    env: { TOP3_RESEARCH_RUN: backing, EARLY_DETECTION_SUBMIT_TOKEN: TOKEN },
  });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.status, 'ready');
  assert.deepEqual(backing.writes, [EARLY_DETECTION_CLAUDE_SUBMISSION_KEY, EARLY_DETECTION_KEY]);
  assert.deepEqual(await readEarlyDetection(backing), result.projection);
});

test('tampered stored projection fails integrity on read', async () => {
  const s = await submission();
  const backing = store();
  await publishEarlyDetectionSubmission(backing, s);
  backing.values.get(EARLY_DETECTION_KEY).entries[0].headline = '書き換えられた見出し。';
  await assert.rejects(() => readEarlyDetection(backing), /EARLY_DETECTION_INTEGRITY_FAILED/);
});

test('invalid submissions are rejected: wrong seal, ascending scores, bad enums, future source', async () => {
  const backing = store();
  const cases = [];
  const wrongSeal = await submission();
  wrongSeal.entries_sha256 = 'f'.repeat(64);
  cases.push(wrongSeal);
  const ascending = await submission();
  ascending.entries[0].momentumScore = 10;
  ascending.entries_sha256 = await earlyDetectionDigest(ascending.entries);
  cases.push(ascending);
  const badEnum = await submission();
  badEnum.entries[1].judgment = 'BUY_NOW';
  badEnum.entries_sha256 = await earlyDetectionDigest(badEnum.entries);
  cases.push(badEnum);
  const futureSource = await submission();
  futureSource.entries[0].source.publishedDate = '2026-12-01';
  futureSource.entries_sha256 = await earlyDetectionDigest(futureSource.entries);
  cases.push(futureSource);
  const badCoverage = await submission();
  badCoverage.entries[0].dataCoverage = 101;
  badCoverage.entries_sha256 = await earlyDetectionDigest(badCoverage.entries);
  cases.push(badCoverage);
  for (const s of cases) {
    const response = await onRequest({
      request: request({ mode: 'publish', submission: s }),
      env: { TOP3_RESEARCH_RUN: backing, EARLY_DETECTION_SUBMIT_TOKEN: TOKEN },
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'EARLY_DETECTION_INPUT_INVALID');
  }
  assert.equal(backing.writes.length, 0);
});

test('endpoint rejects bad auth and unconfigured env', async () => {
  const s = await submission();
  const backing = store();
  let response = await onRequest({
    request: request({ mode: 'preview', submission: s }, { token: 'x'.repeat(64) }),
    env: { TOP3_RESEARCH_RUN: backing, EARLY_DETECTION_SUBMIT_TOKEN: TOKEN },
  });
  assert.equal(response.status, 401);
  response = await onRequest({
    request: request({ mode: 'preview', submission: s }),
    env: { TOP3_RESEARCH_RUN: backing },
  });
  assert.equal(response.status, 503);
});

test('previewEarlyDetectionSubmission matches buildEarlyDetectionProjection exactly', async () => {
  const s = await submission(5);
  assert.deepEqual(await previewEarlyDetectionSubmission(s), await buildEarlyDetectionProjection(s));
});
