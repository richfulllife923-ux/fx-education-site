require('./register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {company}=require('./growth-pipeline-fixtures.cjs');
const {masterCoverage,masterReviewReceipt}=require('../../server/stock-analysis/growth-radar/master-coverage.ts');
test('25 sections audited without pretending 25 complete or generating quality score',()=>{
 const a=company().audit,before=structuredClone(a.report),c=masterCoverage(a.report),r=masterReviewReceipt(a.report,c);
 assert.equal(c.sections.length,25);assert.ok(c.completedSections<25);assert.ok(c.unverifiedSections>0);assert.equal(c.finalResearchState,null);
 assert.equal(r.sections.length,25);assert.ok(r.sections.every(s=>s.reviewed));
 for(const s of r.sections){assert.ok(s.evidenceRefs.every(ref=>c.auditRecords[ref]?.kind==='COVERAGE_AUDIT'));}
 assert.deepEqual(a.report,before);assert.ok(!('score' in c));
});
test('unavailable business remains UNVERIFIED and is a major gap, not template completion',()=>{
 const a=company().audit;delete a.report.researchEvidence;a.report.sections.business=[];a.report.sections.revenue=[];
 const c=masterCoverage(a.report),r=masterReviewReceipt(a.report,c);assert.equal(c.sections[0].status,'UNVERIFIED');
 assert.equal(c.sections[0].evidenceRefs.length,0);assert.ok(r.unresolvedMajorGaps.some(s=>s.includes('Business')));
});
test('Master coverage does not require or create valuations to mark audit performed',()=>{
 const a=company().audit;a.report.sections.valuation=[];const c=masterCoverage(a.report),r=masterReviewReceipt(a.report,c);
 assert.equal(c.sections[14].status,'UNVERIFIED');assert.ok(r.sections[14].reviewed);assert.ok(r.sections[14].remainingUnknowns.length);
});
