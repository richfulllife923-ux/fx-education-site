require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { onRequest } = require('../../functions/api/stock-analysis/observation-submit.ts');
const {
  selectTop5Observation, readTop5Observation, previewObservationSubmission, publishObservationSubmission,
} = require('../../server/stock-analysis/public-observation.ts');
const {
  OBSERVATION_MODEL, OBSERVATION_TOP5_KEY, OBSERVATION_CLAUDE_INPUT_KEY, OBSERVATION_PROVENANCE_KEY,
  OBSERVATION_REVIEW_KEY, observationDigest,
} = require('../../lib/public-observation.ts');

const TOKEN = 't'.repeat(64);

async function seal(p) { p.input_sha256 = await observationDigest({ ...p, input_sha256: '' }); return p; }

async function input(n, hashSeed = 'a') {
  const datum = (period, start, value) => ({
    value,
    source: {
      provider: 'EDINET', classification: 'FACT', basis: 'annual', period, start, currency: 'JPY',
      unit: 'currency', form: '120', accession: 'S100TEST', financialScope: 'CONSOLIDATED',
      url: 'https://disclosure2.edinet-fsa.go.jp/test', retrievedAt: '2026-10-04T00:00:00Z',
      filingDate: '2026-06-25',
      contextRef: period === '2025-03-31' ? 'Prior1YearDuration' : 'CurrentYearDuration',
    },
  });
  const p = {
    schema: 'tutto-public-observation-input/1', model: OBSERVATION_MODEL,
    updated_at: '2026-10-08T12:00:00.000Z', data_observed_at: '2026-10-04T00:00:00.000Z',
    research_full_run_sha256: hashSeed.repeat(64), assessment_sha256: 'b'.repeat(64),
    rows: Array.from({ length: n }, (_, i) => ({
      code: String(1000 + i), name: 'テスト企業' + i, edinetCode: 'E' + String(i + 1).padStart(5, '0'),
      source_sha256: 'c'.repeat(64),
      proof: [
        ['revenue', '2026-03-31', '2025-04-01', 200 + i * 10],
        ['previousRevenue', '2025-03-31', '2024-04-01', 100],
        ['operatingIncome', '2026-03-31', '2025-04-01', 20 + i * 10],
        ['operatingCF', '2026-03-31', '2025-04-01', 40 + i * 10],
      ].map(([name, end, start, value]) => ({ name, ...datum(end, start, value), documentPeriod: '2026-03-31' })),
    })),
    input_sha256: '',
  };
  return seal(p);
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
  return new Request('https://tutto.test/api/stock-analysis/observation-submit', {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('preview computes with the existing model and stores nothing', async () => {
  const i = await input(6);
  const backing = store();
  const response = await onRequest({
    request: request({ mode: 'preview', input: i }),
    env: { TOP3_RESEARCH_RUN: backing, OBSERVATION_SUBMIT_TOKEN: TOKEN },
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.status, 'preview');
  assert.deepEqual(result.projection, await selectTop5Observation(i));
  assert.equal(backing.writes.length, 0);
});

test('publish stores input, provenance and projection; gated read then serves it', async () => {
  const i = await input(6);
  const backing = store();
  const response = await onRequest({
    request: request({ mode: 'publish', input: i }),
    env: { TOP3_RESEARCH_RUN: backing, OBSERVATION_SUBMIT_TOKEN: TOKEN },
  });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.status, 'ready');
  assert.deepEqual(backing.writes, [OBSERVATION_CLAUDE_INPUT_KEY, OBSERVATION_PROVENANCE_KEY, OBSERVATION_TOP5_KEY]);
  const provenance = backing.values.get(OBSERVATION_PROVENANCE_KEY);
  assert.equal(provenance.via, 'CLAUDE_SUBMISSION');
  assert.equal(provenance.review, 'NOT_APPLICABLE');
  assert.equal(provenance.pre, undefined);
  assert.equal(provenance.post, undefined);
  assert.deepEqual(await readTop5Observation(backing), result.projection);
});

test('tampered or foreign provenance fails closed', async () => {
  const i = await input(6);
  for (const mutate of [
    (s) => { s.values.get(OBSERVATION_PROVENANCE_KEY).projection_sha256 = 'f'.repeat(64); },
    (s) => { s.values.get(OBSERVATION_PROVENANCE_KEY).input_sha256 = 'f'.repeat(64); },
    (s) => { s.values.get(OBSERVATION_PROVENANCE_KEY).via = 'UNKNOWN'; },
    (s) => { s.values.get(OBSERVATION_PROVENANCE_KEY).review = 'PASS'; },
    (s) => { s.values.delete(OBSERVATION_PROVENANCE_KEY); },
  ]) {
    const backing = store();
    await publishObservationSubmission(backing, i);
    mutate(backing);
    await assert.rejects(() => readTop5Observation(backing), /OBSERVATION_REVIEW_HOLD/);
  }
});

test('legacy JEV receipts still authorize the read path', async () => {
  const i = await input(6);
  const p = await selectTop5Observation(i);
  const review = {
    scope: 'PUBLIC_OBSERVATION_TOP5', input_sha256: p.integrity.input_sha256, projection_sha256: p.projection_sha256,
    pre: { status: 'PASS', request_id: 'isolated-pre', response_sha256: 'd'.repeat(64) },
    post: { status: 'PASS', request_id: 'isolated-post', response_sha256: 'e'.repeat(64) },
  };
  const backing = store([[OBSERVATION_TOP5_KEY, p], [OBSERVATION_REVIEW_KEY, review]]);
  assert.deepEqual(await readTop5Observation(backing), p);
});

test('endpoint rejects bad auth, unknown mode and invalid input without writing', async () => {
  const i = await input(6);
  const backing = store();
  let response = await onRequest({
    request: request({ mode: 'preview', input: i }, { token: 'x'.repeat(64) }),
    env: { TOP3_RESEARCH_RUN: backing, OBSERVATION_SUBMIT_TOKEN: TOKEN },
  });
  assert.equal(response.status, 401);
  response = await onRequest({
    request: request({ mode: 'preview', input: i }),
    env: { TOP3_RESEARCH_RUN: backing },
  });
  assert.equal(response.status, 503);
  response = await onRequest({
    request: request({ mode: 'replace', input: i }),
    env: { TOP3_RESEARCH_RUN: backing, OBSERVATION_SUBMIT_TOKEN: TOKEN },
  });
  assert.equal(response.status, 400);
  const broken = await input(6);
  broken.rows[0].proof = broken.rows[0].proof.slice(0, 3);
  await seal(broken);
  response = await onRequest({
    request: request({ mode: 'publish', input: broken }),
    env: { TOP3_RESEARCH_RUN: backing, OBSERVATION_SUBMIT_TOKEN: TOKEN },
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'OBSERVATION_INPUT_INVALID');
  assert.equal(backing.writes.length, 0);
});

test('previewObservationSubmission matches selectTop5Observation exactly', async () => {
  const i = await input(4);
  assert.deepEqual(await previewObservationSubmission(i), await selectTop5Observation(i));
});
