const root=require('path').resolve(__dirname,'../..');require(root+'/tests/stock-analysis/register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {observationMetrics,rankObservations,readPublicObservation}=require(root+'/server/stock-analysis/public-observation.ts');
const {OBSERVATION_SCHEMA,OBSERVATION_MODEL,OBSERVATION_KEY,observationDigest,verifyObservationProjection,loadObservation}=require(root+'/lib/public-observation.ts');
const {formalUpdatedAtJst}=require(root+'/lib/formal-updated-at.ts');
const {onRequest}=require(root+'/functions/api/stock-analysis/[[path]].ts');
const rows=[{code:'1000',name:'A',period:'2026-03-31',growth:3,margin:3,cashMargin:3},{code:'1001',name:'B',period:'2026-03-31',growth:2,margin:2,cashMargin:2},{code:'1002',name:'C',period:'2026-03-31',growth:1,margin:1,cashMargin:1}];
async function projection(){const p={schema:OBSERVATION_SCHEMA,mode:'PUBLIC_OBSERVATION',model:OBSERVATION_MODEL,run_id:'observation-'+ 'a'.repeat(24),generated_at:'2026-10-08T12:00:00.000Z',data_observed_at:'2026-10-04T12:00:00.000Z',publication_status:'READY',cohort_count:3,top3:rankObservations(rows).map((r,i)=>({rank:i+1,code:r.code,name:r.name,period:r.period,score:r.score})),integrity:{research_full_run_sha256:'b'.repeat(64),assessment_sha256:'c'.repeat(64)},projection_sha256:''};p.projection_sha256=await observationDigest(p);return p;}
test('geometric evaluation has exact midranks, balanced dimensions and order independence',()=>{
 const ranked=rankObservations(rows);assert.ok(Math.abs(ranked[0].rawScore-250/3)<1e-10);assert.equal(ranked[1].score,50);
 assert.deepEqual(rankObservations([...rows].reverse()),ranked);
 const mixed=rankObservations([{...rows[0],cashMargin:0},rows[1],rows[2]]);const a=mixed.find(x=>x.code==='1000');assert.ok(Math.abs(a.rawScore-Math.cbrt(a.percentiles.reduce((x,y)=>x*y,1)))<1e-10);assert.ok(a.rawScore<a.percentiles.reduce((x,y)=>x+y)/3);
});
test('tied inputs share score; duplicate identity, insufficient and nonfinite data rejected',()=>{
 const tied=rankObservations(rows.map(r=>({...r,growth:1,margin:1,cashMargin:1})));assert.ok(tied.every(r=>r.score===50));assert.deepEqual(tied.map(r=>r.code),['1000','1001','1002']);
 for(const invalid of [rows.slice(0,2),[rows[0],rows[0],rows[1]],[{...rows[0],growth:NaN},...rows.slice(1)]])assert.throws(()=>rankObservations(invalid));
});
function company(){const period=(end,start,prior=false)=>{const datum=value=>({value,source:{provider:'EDINET',classification:'FACT',basis:'annual',period:end,start,currency:'JPY',unit:'currency',form:'120',accession:'S100TEST',financialScope:'CONSOLIDATED',url:'https://disclosure2.edinet-fsa.go.jp/test',retrievedAt:'2026-10-04T00:00:00Z',filingDate:'2026-06-25'}});return {end,basis:'annual',currency:'JPY',revenue:datum(prior?100:120),operatingIncome:datum(12),operatingCF:datum(24)};};return {provider:'EDINET',identity:{code:'1000',name:'A',edinetCode:'E00001',country:'JP'},annual:[period('2026-03-31','2025-04-01'),period('2025-03-31','2024-04-01',true)]};}
test('actual annual values retained and source, period, currency, scope and missing checks fail closed',()=>{
 const c=company(),before=JSON.stringify(c);const m=observationMetrics(c,'2026-10-08T00:00:00Z');assert.ok(Math.abs(m.growth-.2)<1e-12);assert.equal(m.margin,.1);assert.equal(m.cashMargin,.2);assert.equal(JSON.stringify(c),before);
 for(const modify of [c=>c.annual[0].operatingCF.value=null,c=>c.annual[0].revenue.value=0,c=>c.annual[0].revenue.source.period='2025-03-31',c=>c.annual[0].revenue.source.financialScope='NON_CONSOLIDATED',c=>c.annual[0].revenue.source.currency='USD',c=>c.annual[0].revenue.source.basis='quarterly',c=>c.annual[0].revenue.source.start='2026-01-01']){const bad=company();modify(bad);assert.equal(observationMetrics(bad,'2026-10-08T00:00:00Z'),null);}
});
test('saved result is independent from formal gate, preserves timestamps and detects tampering',async()=>{
 const p=await projection();const store={get:async key=>{assert.equal(key,OBSERVATION_KEY);return p;}};assert.deepEqual(await readPublicObservation(store),p);assert.equal(formalUpdatedAtJst(p.generated_at),'2026/10/08 21:00 JST');
 const bad=structuredClone(p);bad.top3[0].score=100;await assert.rejects(()=>verifyObservationProjection(bad));await assert.rejects(()=>readPublicObservation({get:async()=>null}));assert.equal('jev' in p,false);assert.equal('formalEligibility' in p,false);
});
test('real route reads only observation key, client re-fetch uses no-store, formal data untouched',async()=>{
 const p=await projection();let calls=0;const store={get:async key=>{calls++;assert.equal(key,OBSERVATION_KEY);return p;}};
 const request=new Request('http://localhost/api/stock-analysis/observation');const response=await onRequest({request,env:{TOP3_RESEARCH_RUN:store}});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),p);
 const old=global.fetch;try{global.fetch=async(url,init)=>{assert.equal(url,'/api/stock-analysis/observation');assert.equal(init.cache,'no-store');return onRequest({request,env:{TOP3_RESEARCH_RUN:store}});};assert.deepEqual(await loadObservation(new AbortController().signal),p);assert.deepEqual(await loadObservation(new AbortController().signal),p);assert.equal(calls,3);}finally{global.fetch=old;}
 const unavailable=await onRequest({request,env:{TOP3_RESEARCH_RUN:{get:async()=>null}}});assert.equal(unavailable.status,503);
});
