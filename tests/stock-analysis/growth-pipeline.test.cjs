require('./register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {snapshot}=require('./growth-pipeline-fixtures.cjs');
const {projectSnapshot,readGrowthFeatured,saveGrowthSnapshot}=require('../../server/stock-analysis/growth-radar/pipeline.ts');
const clock=()=>new Date('2026-10-02T00:03:00Z');
for(const count of [0,1,2,3])test(count+' formal candidates round trip without padding',async()=>{
 const value=snapshot(count),before=structuredClone(value);let saved;
 await saveGrowthSnapshot({put:async(k,v)=>{assert.equal(k,'top3-research-run');saved=v;}},value,clock,{result:projectSnapshot(value,clock),sourceGeneration:'ISOLATED-TEST-GENERATION',jev:{pre:'PASS',post:'PASS'}});
 let requests=0;const result=await readGrowthFeatured({get:async()=>{requests++;return JSON.parse(saved);}},clock,async()=>true);
 assert.equal(requests,1);assert.equal(result.selectedCount,count);assert.equal(result.entries.length,count);
 assert.equal(result.uiState,count?'READY':'VERIFYING');assert.deepEqual(value,before);
});
test('4+ uses existing comparisons, never slice or rank by score',()=>{
 const value=snapshot(4),result=projectSnapshot(value,clock);assert.equal(result.state,'COMPARISON_REQUIRED');assert.equal(result.selectedCount,0);
 const {comparisonDimensions}=require('../../lib/top3-selection.ts');
 for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)value.selectionRun.comparisons.push({a:(1111+i)+'.JP',b:(1111+j)+'.JP',relation:'A_STRONGER',reviewed:true,dimensions:Object.fromEntries(comparisonDimensions.map(d=>[d,{reason:'TEST DATA',evidenceRefs:['TEST DATA reviewed comparison']}]))});
 assert.equal(projectSnapshot(value,clock).selectedCount,1);
});
for(const key of ['business','cashFlowSustainability','majorRisk','counterThesis'])test(key+' unresolved prevents Top3 despite numeric report',()=>{
 const value=snapshot();value.selectionRun.audits[0].report.researchEvidence[key].status='UNVERIFIED';assert.equal(projectSnapshot(value,clock).selectedCount,0);
});
test('GRAY and absent Master review excluded',()=>{
 for(const change of [a=>a.report.researchStatus.status='GRAY',a=>a.masterReview=null]){
  const value=snapshot();change(value.selectionRun.audits[0]);assert.equal(projectSnapshot(value,clock).selectedCount,0);
 }
});
test('unreviewed noncandidate Universe members prevent a formal completion',()=>{
 const value=snapshot(2);value.inputs[1].sources[0].text='売上高が増加した。';const result=projectSnapshot(value,clock);
 assert.equal(result.state,'RECHECK_REQUIRED');assert.equal(result.selectedCount,0);assert.equal(result.candidateCount,1);
});
test('no fabricated score, Why Now and risk retain exact evidence',()=>{
 const result=projectSnapshot(snapshot(),clock),c=result.selected[0];assert.equal(c.summaryScore.score,null);
 assert.ok(c.whatIsChanging.length);assert.ok(c.radarWhyNow[0].quote.includes('需要'));assert.ok(c.majorRisks.length);assert.ok(c.nextConfirmation.length);
});
test('stale day and incomplete universe never publish prior candidates',()=>{
 const value=snapshot();assert.equal(projectSnapshot(value,()=>new Date('2026-10-03T01:00:00Z')).selectedCount,0);
 value.selectionRun.complete=false;assert.equal(projectSnapshot(value,clock).uiState,'VERIFYING');
});
test('missing snapshot is verifying, corrupted snapshot is error, not formal zero',async()=>{
 assert.equal((await readGrowthFeatured(undefined,clock)).uiState,'VERIFYING');
 await assert.rejects(readGrowthFeatured({get:async()=>({version:'growth-radar-public/1'})},clock));
});
test('identity / document / period mixing fail closed',()=>{
 for(const change of [i=>i.identity.companyId='E99999',i=>i.evaluationPeriod='2025-03-31',i=>i.latestDocumentIds=['S100OLDX']]){
  const value=snapshot();change(value.inputs[0]);assert.equal(projectSnapshot(value,clock).selectedCount,0);
 }
});
test('duplicate company input and future generated timestamp rejected',()=>{
 const value=snapshot();value.inputs.push(structuredClone(value.inputs[0]));assert.throws(()=>projectSnapshot(value,clock));
 const future=snapshot();future.generatedAt='2099-01-01T00:00:00Z';assert.throws(()=>projectSnapshot(future,clock));
});
test('Why Now exact spans survive multiple spaces between English sentences',()=>{
 const value=snapshot();value.inputs[0].sources[0].text='Revenue increased.   New customer acquisition contributed to revenue growth.';
 const {evaluateRadar}=require('../../server/stock-analysis/growth-radar/engine.ts');const r=evaluateRadar(value.inputs[0]);
 assert.equal(r.state,'CANDIDATE');const relation=r.relations[0];assert.equal(relation.quote,'New customer acquisition contributed to revenue growth.');
 for(const f of r.facts)assert.equal(f.quote,value.inputs[0].sources[0].text.slice(f.span.start,f.span.end));
});

test('missing primary source cannot become a completed negative audit',()=>{
 const s=snapshot();s.selectionRun.audits[0].report=null;s.selectionRun.audits[0].errors=['LATEST_FORMAL_ANNUAL_UNAVAILABLE'];
 s.inputs[0].sources=[];s.inputs[0].conflicts=['PRIMARY_SOURCE_UNAVAILABLE'];
 const r=projectSnapshot(s,clock);assert.equal(r.state,'IN_PROGRESS');assert.equal(r.selectedCount,0);
});

test('fresh process restore produces the identical saved-snapshot projection',()=>{
 const cp=require('node:child_process'),path=require('node:path'),s=snapshot(2);
 const script="require('./tests/stock-analysis/register.cjs');const fs=require('node:fs');const {projectSnapshot}=require('./server/stock-analysis/growth-radar/pipeline.ts');process.stdout.write(JSON.stringify(projectSnapshot(JSON.parse(fs.readFileSync(0,'utf8')),()=>new Date('2026-10-02T00:03:00Z'))));";
 const restored=cp.execFileSync(process.execPath,['-e',script],{cwd:path.resolve(__dirname,'../..'),input:JSON.stringify(s),encoding:'utf8'});
 assert.deepEqual(JSON.parse(restored),JSON.parse(JSON.stringify(projectSnapshot(s,clock))));
});

test('R12 may retain lawful historical CF provenance while current business/risk must stay current',()=>{
 const s=snapshot(),e=s.selectionRun.audits[0].report.researchEvidence,p=e.provenance[e.cashFlowSustainability.evidenceRefs[0]];
 Object.assign(p,{documentId:'S100PRIO',url:'https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100PRIO',fiscalPeriod:'2025-03-31'});
 assert.equal(projectSnapshot(s,clock).selectedCount,1);
 Object.assign(e.provenance[e.business.evidenceRefs[0]],{documentId:p.documentId,url:p.url,fiscalPeriod:p.fiscalPeriod});assert.equal(projectSnapshot(s,clock).selectedCount,0);
});

test('current interim Why Now remains distinct from latest annual Master fiscal date',()=>{
 const s=snapshot(),input=s.inputs[0],audit=s.selectionRun.audits[0];
 const half={...input.sources[0],id:'TEST-current-half',documentId:'S100HALF',url:'https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100HALF',period:'2026-09-30',filingDate:'2026-10-01'};
 input.sources.push(half);input.evaluationPeriod=half.period;input.latestDocumentIds.push(half.documentId);audit.latestDocuments.push(half.documentId);
 const result=projectSnapshot(s,clock);assert.equal(result.selectedCount,1);assert.equal(result.selected[0].fiscalDate,'2026-03-31');assert.equal(result.selected[0].radarWhyNow[0].period,half.period);
 input.sources.pop();assert.equal(projectSnapshot(s,clock).selectedCount,0);
});
