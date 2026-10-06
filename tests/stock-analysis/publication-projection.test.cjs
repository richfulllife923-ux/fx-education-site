// Isolated transport tests; no fixture is written to a production stock key.
const root=require('node:path').resolve(__dirname,'../..');require(root+'/tests/stock-analysis/register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process'),fs=require('node:fs');
const {snapshot,projection}=require(root+'/tests/stock-analysis/growth-pipeline-fixtures.cjs');
const {projectSnapshot,saveGrowthSnapshot,readGrowthFeatured}=require(root+'/server/stock-analysis/growth-radar/pipeline.ts');
const {createPublicationProjection,validatePublicationProjection}=require(root+'/server/stock-analysis/growth-radar/publication-projection.ts');
const {loadFeatured}=require(root+'/lib/featured-client.ts');
const clock=()=>new Date('2026-10-02T00:03:00Z'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const context=s=>({result:projectSnapshot(s,clock),sourceGeneration:'ISOLATED-TEST-GENERATION',jev:{pre:'PASS',post:'PASS'}});
test('full input, universe, unknown issuers, NOT_MET and evidence remain byte-for-byte unchanged',async()=>{
 const s=snapshot(3),originalUnknowns=s.selectionRun.manifest.remainingUnknowns.length;for(let i=0;i<86;i++){
  const u=snapshot(1);u.selectionRun.universe[0].code='unknown-'+i;u.selectionRun.universe[0].edinetCode='unknown-'+i;
  s.selectionRun.universe.push(u.selectionRun.universe[0]);s.selectionRun.manifest.remainingUnknowns.push('UNVERIFIED-'+i);
 }
 s.selectionRun.complete=false;const before=JSON.stringify(s),p=await createPublicationProjection(s,context(s));
 assert.equal(JSON.stringify(s),before);assert.equal(p.universe_count,89);assert.equal(s.selectionRun.manifest.remainingUnknowns.length,originalUnknowns+86);assert.equal(p.full_run_integrity.sha256,hash(before));
});
test('Top3 identity, order, observation score and all copied formal states match the supplied output',async()=>{
 const s=snapshot(3),c=context(s);const p=await createPublicationProjection(s,c);
 assert.deepEqual(p.selected.map(x=>x.symbol),c.result.selected.map(x=>x.symbol));
 assert.deepEqual(p.selected.map(x=>x.observationScore),c.result.selected.map(x=>x.summaryScore));
 assert.deepEqual(p.jev,c.jev);assert.equal(p.candidate_count,c.result.candidateCount);assert.equal(p.selected_count,c.result.selectedCount);
 assert.equal(p.full_run_integrity.result_sha256,hash(JSON.stringify(c.result)));assert.ok(Buffer.byteLength(JSON.stringify(p))<16*1024);
});
test('projection generation and API reading never invoke the Selection Engine, Radar or scoring',async()=>{
 const s=snapshot(3),c=context(s);
 const originals=[];for(const file of ['/lib/top3-selection.ts','/lib/summary-score-report.ts','/server/stock-analysis/growth-radar/engine.ts']){
  const m=require(root+file);for(const key of Object.keys(m))if(typeof m[key]==='function'){originals.push({m,key,value:m[key]});m[key]=()=>{throw Error('Unexpected formal evaluator invocation');};}
 }
 try{const p=await createPublicationProjection(s,c);assert.equal((await readGrowthFeatured({get:async()=>p},clock,async()=>true)).selectedCount,3);}
 finally{for(const {m,key,value} of originals)m[key]=value;}
});
test('one atomic key, API contract and client contract round trip without full run data',async()=>{
 const s=snapshot(3),c=context(s);let value,puts=0;
 await saveGrowthSnapshot({put:async(key,v)=>{assert.equal(key,'top3-research-run');value=v;puts++;}},s,clock,c);
 assert.equal(puts,1);assert.ok(!value.includes('selectionRun'));assert.ok(!value.includes('sources'));assert.ok(!value.includes('predicateTrace'));
 const r=await readGrowthFeatured({get:async()=>JSON.parse(value)},clock,async()=>true),before=global.fetch;
 try{global.fetch=async()=>new Response(JSON.stringify(r));const client=await loadFeatured(new AbortController().signal);assert.equal(client.selectedCount,3);assert.equal(client.entries[0].rank,1);}
 finally{global.fetch=before;}
});
test('fresh process restart restores identical projection selection and run identity',async()=>{
 const p=await projection(snapshot(3));
 const script="require('./tests/stock-analysis/register.cjs');const fs=require('node:fs');const {readGrowthFeatured}=require('./server/stock-analysis/growth-radar/pipeline.ts');readGrowthFeatured({get:async()=>JSON.parse(fs.readFileSync(0,'utf8'))},()=>new Date('2026-10-02T00:03:00Z'),async()=>true).then(r=>process.stdout.write(JSON.stringify(r)));";
 const restored=JSON.parse(cp.execFileSync(process.execPath,['-e',script],{cwd:root,input:JSON.stringify(p),encoding:'utf8'}));
 assert.deepEqual(restored,JSON.parse(JSON.stringify(await readGrowthFeatured({get:async()=>p},clock,async()=>true))));
});
test('JEV HOLD/UNVERIFIED, metadata change, day rollover, tampering and invalid scores cannot publish',async()=>{
 const s=snapshot(3);for(const status of ['HOLD','UNVERIFIED']){
  const c=context(s);c.jev.post=status;const p=await createPublicationProjection(s,c),r=await readGrowthFeatured({get:async()=>p},clock,async()=>true);
  assert.equal(r.selectedCount,0);assert.equal(r.uiState,'VERIFYING');
 }
 const p=await projection(s);assert.equal((await readGrowthFeatured({get:async()=>p},clock,async()=>false)).selectedCount,0);
 assert.equal((await readGrowthFeatured({get:async()=>p},()=>new Date('2026-10-03T00:00:00Z'),async()=>true)).selectedCount,0);
 for(const mutate of [p=>p.run_id='DIFFERENT',p=>p.selected.reverse(),p=>p.selected[0].observationScore.score=101,p=>p.jev.pre='HOLD']){
  const broken=structuredClone(p);mutate(broken);await assert.rejects(validatePublicationProjection(broken,clock));
 }
});
