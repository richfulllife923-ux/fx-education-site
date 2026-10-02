require('./register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {sourceFixture}=require('./growth-source-fixture.cjs');
const {radarInputFromCompany,deepResearchCompany}=require('../../server/stock-analysis/growth-radar/source.ts');
const {snapshot}=require('./growth-pipeline-fixtures.cjs');
const {projectSnapshot}=require('../../server/stock-analysis/growth-radar/pipeline.ts');
const {candidateBlockers}=require('../../lib/top3-selection.ts');
function integrated(f){const input=radarInputFromCompany(f.company,f.bundle,f.documents,f.at),audit=deepResearchCompany(f.identity,f.company,f.bundle,f.company.annual[0].end,f.documents,input),s=snapshot();s.inputs=[input];s.selectionRun.audits=[audit];s.selectionRun.universe=[f.identity];return {s,audit};}
const clock=()=>new Date('2026-10-02T00:03:00Z');
test('canonical + typed primary facts -> actual R11-R14 -> R8 -> Master coverage -> existing S1-S7 -> public card',()=>{
 const f=sourceFixture(),before=JSON.stringify(f),{s,audit}=integrated(f);
 assert.deepEqual(candidateBlockers(audit),[]);assert.equal(audit.report.researchStatus.status,'STAY');
 assert.equal(audit.masterCoverage.sections.length,25);const result=projectSnapshot(s,clock);assert.equal(result.selectedCount,1);assert.equal(result.entries[0].whyNow.length,2);assert.equal(JSON.stringify(f),before);
});
test('new conflicting risk removes formerly lawful candidate; no previous-candidate backfill',()=>{
 const f=sourceFixture();assert.equal(projectSnapshot(integrated(f).s,clock).selectedCount,1);
 f.bundle.documents[0].fragments.find(f=>f.kind==='RiskFact').fields.state='UNRESOLVED';
 assert.equal(projectSnapshot(integrated(f).s,clock).selectedCount,0);
});
test('public projection has no internal rules, parser details, source field paths or trace',()=>{
 const {s}=integrated(sourceFixture());s.selectionRun.manifest.remainingUnknowns.push('C:\\private\\audit.txt');
 const result=projectSnapshot(s,clock),raw=JSON.stringify(result);for(const key of ['ruleTrace','parserVersion','auditRecords','ownerDecisionsRequired','C:\\private','candidateEvidenceRefs','"field":'])assert.ok(!raw.includes(key),key);
 assert.deepEqual(result,projectSnapshot(structuredClone(s),clock));
});

test('repeated deterioration is not promoted into a positive growth qualification',()=>{
 const f=sourceFixture();for(const d of f.bundle.documents)for(const t of d.fragments)if(t.structure==='TEXT_ONLY')t.text='顧客需要の減少により、売上が減少した。';
 const {s,audit}=integrated(f);assert.ok(!audit.report.researchStatus.ruleTrace.some(t=>t.ruleId==='R8'&&t.inputState==='MET'));assert.equal(projectSnapshot(s,clock).selectedCount,0);
});
