require('./register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {snapshot,projection}=require('./growth-pipeline-fixtures.cjs');
const {readGrowthFeatured}=require('../../server/stock-analysis/growth-radar/pipeline.ts');
const clock=()=>new Date('2026-10-02T00:03:00Z');
const saved=value=>({get:async()=>projection(value)});
test('unchanged official metadata returns the same selection with separate check time',async()=>{
 const value=snapshot(2),before=structuredClone(value);let calls=0;
 const r=await readGrowthFeatured(saved(value),clock,async m=>{calls++;assert.equal(m.snapshotId,value.selectionRun.manifest.snapshotId);return true;});
 assert.equal(calls,1);assert.equal(r.selectedCount,2);assert.equal(r.freshnessCheckedAt,clock().toISOString());assert.equal(r.generatedAt,value.generatedAt);assert.deepEqual(value,before);
});
test('same-day disclosure change invalidates all previous cards; no scanner starts',async()=>{
 const r=await readGrowthFeatured(saved(snapshot()),clock,async()=>false);
 assert.equal(r.selectedCount,0);assert.equal(r.state,'RECHECK_REQUIRED');assert.equal(r.freshnessCheckedAt,null);
});
test('formal zero also needs a fresh metadata check; missing verifier cannot certify it',async()=>{
 const r=await readGrowthFeatured(saved(snapshot(0)),clock);
 assert.equal(r.state,'RECHECK_REQUIRED');assert.equal(r.uiState,'VERIFYING');
});
test('metadata acquisition error remains an error, not a formal negative result',async()=>{
 await assert.rejects(readGrowthFeatured(saved(snapshot()),clock,async()=>{throw Error('official metadata unavailable');}));
});
test('day rollover during freshness check withholds cards',async()=>{
 let at=clock();const r=await readGrowthFeatured(saved(snapshot()),()=>at,async()=>{at=new Date('2026-10-02T15:00:00Z');return true;});
 assert.equal(r.selectedCount,0);assert.equal(r.state,'RECHECK_REQUIRED');
});
test('GRAY without a reviewed exclusion receipt keeps the replacement selection unconfirmed',async()=>{
 const old=snapshot(3),updated=structuredClone(old);updated.selectionRun.audits[1].report.researchStatus.status='GRAY';
 const r=await readGrowthFeatured(saved(updated),clock,async()=>true);assert.equal(r.selectedCount,0);assert.equal(r.state,'RECHECK_REQUIRED');assert.equal(r.uiState,'VERIFYING');assert.deepEqual(r.entries,[]);assert.equal(updated.selectionRun.audits[1].report.researchStatus.status,'GRAY');
});
