const root=require('path').resolve(__dirname,'../..');require(root+'/tests/stock-analysis/register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {selectTop5Observation,refreshTop5Observation,readTop5Observation,rankObservations}=require(root+'/server/stock-analysis/public-observation.ts');
const {OBSERVATION_MODEL,OBSERVATION_INPUT_KEY,OBSERVATION_REVIEW_KEY,OBSERVATION_TOP5_KEY,observationDigest,verifyTop5Observation,loadTop5Observation}=require(root+'/lib/public-observation.ts');
const {onRequest}=require(root+'/functions/api/stock-analysis/[[path]].ts');
const {formalUpdatedAtJst}=require(root+'/lib/formal-updated-at.ts');
async function input(n){
 const datum=(period,start,value)=>({value,source:{provider:'EDINET',classification:'FACT',basis:'annual',period,start,currency:'JPY',unit:'currency',form:'120',accession:'S100TEST',financialScope:'CONSOLIDATED',url:'https://disclosure2.edinet-fsa.go.jp/test',retrievedAt:'2026-10-04T00:00:00Z',filingDate:'2026-06-25',contextRef:period==='2025-03-31'?'Prior1YearDuration':'CurrentYearDuration'}});
 const p={schema:'tutto-public-observation-input/1',model:OBSERVATION_MODEL,updated_at:'2026-10-08T12:00:00.000Z',data_observed_at:'2026-10-04T00:00:00.000Z',research_full_run_sha256:'a'.repeat(64),assessment_sha256:'b'.repeat(64),rows:Array.from({length:n},(_,i)=>({code:String(1000+i),name:'テスト企業'+i,edinetCode:'E'+String(i+1).padStart(5,'0'),source_sha256:'c'.repeat(64),proof:[['revenue','2026-03-31','2025-04-01',200+i*10],['previousRevenue','2025-03-31','2024-04-01',100],['operatingIncome','2026-03-31','2025-04-01',20+i*10],['operatingCF','2026-03-31','2025-04-01',40+i*10]].map(([name,end,start,value])=>({name,...datum(end,start,value),documentPeriod:'2026-03-31'}))})),input_sha256:''};return seal(p);
}
async function seal(p){p.input_sha256=await observationDigest({...p,input_sha256:''});return p;}
function review(p){return {scope:'PUBLIC_OBSERVATION_TOP5',input_sha256:p.integrity.input_sha256,projection_sha256:p.projection_sha256,pre:{status:'PASS',request_id:'isolated-pre',response_sha256:'d'.repeat(64)},post:{status:'PASS',request_id:'isolated-post',response_sha256:'e'.repeat(64)}};}
function store(i,p){const values=new Map([[OBSERVATION_INPUT_KEY,i],[OBSERVATION_REVIEW_KEY,review(p)],[OBSERVATION_TOP5_KEY,p]]);const writes=[];return {values,writes,get:async k=>{assert.ok([OBSERVATION_INPUT_KEY,OBSERVATION_REVIEW_KEY,OBSERVATION_TOP5_KEY].includes(k),'no formal reads');return values.get(k)??null;},put:async(k,v)=>{assert.equal(k,OBSERVATION_TOP5_KEY,'no formal writes');writes.push(k);values.set(k,JSON.parse(v));}};}
for(const n of [0,1,2,3,4,5,6,9])test(`eligible count ${n}: actual count bounded to five, correct order and unchanged calculation`,async()=>{
 const i=await input(n),p=await selectTop5Observation(i);assert.equal(p.cohort_count,n);assert.equal(p.selected_count,Math.min(n,5));assert.equal(p.top5.length,Math.min(n,5));
 const m=i.rows.map(r=>{const [a,b,c,d]=r.proof;return {code:r.code,name:r.name,period:a.source.period,growth:a.value/b.value-1,margin:c.value/a.value,cashMargin:d.value/a.value};});
 assert.deepEqual(p.top5,rankObservations(m).slice(0,5).map((r,j)=>({rank:j+1,code:r.code,name:r.name,period:r.period,score:r.score})));assert.deepEqual(await verifyTop5Observation(p),p);
 if(n>5)assert.equal(p.top5[0].code,String(999+n));
});
test('refresh performs selection from latest saved generation, changes membership and preserves unchanged time',async()=>{
 const a=await input(6),p=await selectTop5Observation(a),s=store(a,p);assert.deepEqual(await refreshTop5Observation(s),p);assert.equal(s.writes.length,0);assert.equal(formalUpdatedAtJst(p.generated_at),'2026/10/08 21:00 JST');
 const b=structuredClone(a);b.updated_at='2026-10-09T00:00:00.000Z';b.rows[0].proof[0].value=1e7;b.rows[0].proof[2].value=1e8;b.rows[0].proof[3].value=1e8;await seal(b);const next=await selectTop5Observation(b);assert.equal(next.top5[0].code,'1000');
 s.values.set(OBSERVATION_INPUT_KEY,b);s.values.set(OBSERVATION_REVIEW_KEY,review(next));assert.deepEqual(await refreshTop5Observation(s),next);assert.equal(s.writes.length,1);assert.equal(next.generated_at,b.updated_at);assert.notEqual(next.run_id,p.run_id);assert.deepEqual(await refreshTop5Observation(s),next);assert.equal(s.writes.length,1);
});
test('missing, HOLD, wrong generation and wrong projection JEV release seals fail closed without writing',async()=>{
 const i=await input(6),p=await selectTop5Observation(i);for(const mutate of [s=>s.values.delete(OBSERVATION_REVIEW_KEY),s=>s.values.get(OBSERVATION_REVIEW_KEY).pre.status='HOLD',s=>s.values.get(OBSERVATION_REVIEW_KEY).post.status='UNVERIFIED',s=>s.values.get(OBSERVATION_REVIEW_KEY).input_sha256='f'.repeat(64),s=>s.values.get(OBSERVATION_REVIEW_KEY).projection_sha256='f'.repeat(64)]){const s=store(i,p);mutate(s);await assert.rejects(()=>refreshTop5Observation(s));await assert.rejects(()=>readTop5Observation(s));assert.equal(s.writes.length,0);}
});
test('saved facts retain source/period/scope/nil rules; no padded cards',async()=>{
 const base=await input(6);for(const modify of [r=>r.proof[0].source.form='030',r=>r.proof[0].source.currency='USD',r=>r.proof[0].source.financialScope='NON_CONSOLIDATED',r=>r.proof[0].source.basis='quarterly']){const i=structuredClone(base);modify(i.rows[5]);await seal(i);const p=await selectTop5Observation(i);assert.equal(p.cohort_count,5);assert.ok(!p.top5.some(r=>r.code==='1005'));}
 const nil=structuredClone(base);nil.rows[0].proof[0].value=null;await seal(nil);await assert.rejects(()=>selectTop5Observation(nil));
 const tampered=structuredClone(base);tampered.rows[0].proof[0].value+=1;await assert.rejects(()=>selectTop5Observation(tampered));
 const wrong=structuredClone(base);wrong.rows[0].proof[0].documentPeriod='2025-03-31';await seal(wrong);await assert.rejects(()=>selectTop5Observation(wrong));
});
test('versioned API GET/POST and browser refresh client use actual saved input, reject wrong methods/origin',async()=>{
 const i=await input(6),p=await selectTop5Observation(i),s=store(i,p);let calls=0;const old=global.fetch;
 try{global.fetch=async(url,init)=>{calls++;return onRequest({request:new Request('https://example.test'+url,{method:init.method,headers:{'Origin':'https://example.test','CF-Connecting-IP':'top5-client'}}),env:{TOP3_RESEARCH_RUN:s}});};assert.deepEqual(await loadTop5Observation(new AbortController().signal),p);assert.deepEqual(await loadTop5Observation(new AbortController().signal,true),p);assert.equal(calls,2);}finally{global.fetch=old;}
 for(const [endpoint,method,origin,status] of [['observation-v2','POST',null,405],['observation-refresh','GET',null,405],['observation-refresh','POST','https://other.test',403],['observation','POST',null,405]]){const response=await onRequest({request:new Request('https://example.test/api/stock-analysis/'+endpoint,{method,headers:origin?{Origin:origin}:{}}),env:{TOP3_RESEARCH_RUN:s}});assert.equal(response.status,status);}
 s.values.delete(OBSERVATION_REVIEW_KEY);const response=await onRequest({request:new Request('https://example.test/api/stock-analysis/observation-refresh',{method:'POST',headers:{'CF-Connecting-IP':'hold-test'}}),env:{TOP3_RESEARCH_RUN:s}});assert.equal(response.status,503);assert.equal(s.writes.length,0);
});
