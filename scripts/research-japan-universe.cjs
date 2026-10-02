// Offline, resumable FREE EDINET discovery. No ticker/watchlist/paid-provider option.
// Raw audit artifacts are server-only under ignored .stock-test-output. This never publishes.
require("../tests/stock-analysis/register.cjs");
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {readZip,parseCsv}=require("../server/stock-analysis/zip.ts"),{PrimaryHttp}=require("../server/stock-analysis/primary-http.ts");
const {EdinetProvider,mergeEdinetRows}=require("../server/stock-analysis/edinet.ts");
const {universeFilings}=require("../server/stock-analysis/top3-universe.ts");
const {selectionVersion}=require("../lib/top3-selection.ts");
const {parserVersion,formalSourceHashes,protectedFiles}=require("../server/stock-analysis/top3-versions.ts");
const {EvidenceCollector}=require("../server/stock-analysis/research-evidence/extraction.ts");
const {radarInputFromCompany,deepResearchCompany}=require("../server/stock-analysis/growth-radar/source.ts");
const {evaluateRadar}=require("../server/stock-analysis/growth-radar/engine.ts");
const {saveGrowthSnapshot,snapshotVersion}=require("../server/stock-analysis/growth-radar/pipeline.ts");
const args=process.argv.slice(2),max=Number(args.find(s=>s.startsWith("--max-companies="))?.split("=")[1]??"10");
if(args.some(s=>!/^--max-companies=\d+$/.test(s))||!Number.isInteger(max)||max<0||max>10000)throw new Error("Only --max-companies=0..10000 is supported. No manual tickers.");
const root=path.resolve(__dirname,".."),out=path.join(root,".stock-test-output","growth-radar-discovery"),hash=s=>crypto.createHash("sha256").update(s).digest("hex");
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>hash(JSON.stringify(canonical(v))),save=(file,value)=>{fs.writeFileSync(file+".tmp",JSON.stringify(value)+"\n");fs.renameSync(file+".tmp",file);};
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const next=d=>new Date(Date.parse(d)+86400000).toISOString().slice(0,10);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 // Single scanner ownership; never multiple processes sharing a request budget/checkpoint.
 let lock;try{lock=fs.openSync(path.join(out,"run.lock"),"wx");}catch{throw new Error("Scanner already running; inspect run.lock before recovery.");}
 try{
 const measured=hash(protectedFiles.map(f=>f+":"+hash(fs.readFileSync(path.join(root,f)))).join("\n"));
 if(parserVersion!=="edinet/"+measured)throw new Error("Parser fingerprint changed; update reviewed versions first.");
 const vault=path.join("C:/Users/richf/Documents/TUTTO_PROJECT/TUTTO_OBSIDIAN/02_KNOWLEDGE/Investment");
 for(const source of formalSourceHashes)if(hash(fs.readFileSync(path.join(vault,source.file)))!==source.sha256)throw new Error("Current formal rule source changed; re-review required.");
 const vars=fs.readFileSync(path.join(root,".dev.vars"),"utf8"),key=process.env.EDINET_API_KEY||vars.match(/^EDINET_API_KEY=(.*)$/m)?.[1]?.trim().replace(/^(['"])(.*)\1$/,"$2");
 if(!key)throw new Error("Server EDINET key unavailable.");
 const http=new PrimaryHttp(fetch,1100),start=new Date().toISOString(),asOf=today();
 async function identities(){
 const result=await http.get("https://disclosure2dl.edinet-fsa.go.jp/searchdocument/codelist/Edinetcode.zip","identity",0);
 const files=await readZip(result.bytes,n=>n.endsWith(".csv"),4*1024*1024);if(files.length!==1)throw new Error("Issuer schema");
 const rows=parseCsv(new TextDecoder("shift_jis").decode(files[0].bytes)),head=rows[1];
 const col=n=>{const i=head.indexOf(n);if(i<0)throw new Error("Issuer schema");return i;};
 const c=Object.fromEntries(["証券コード","ＥＤＩＮＥＴコード","提出者名","提出者名（英字）","提出者業種","提出者種別","上場区分"].map(n=>[n,col(n)]));
 const universe=rows.slice(2).filter(r=>r[c["提出者種別"]]==="内国法人・組合"&&r[c["上場区分"]]==="上場"&&/^[1-9][0-9]{2}[A-Z0-9]0$/.test(r[c["証券コード"]])&&/^E\d{5}$/.test(r[c["ＥＤＩＮＥＴコード"]])).map(r=>({code:r[c["証券コード"]].slice(0,4),edinetCode:r[c["ＥＤＩＮＥＴコード"]],name:r[c["提出者名"]],englishName:r[c["提出者名（英字）"]],industry:r[c["提出者業種"]]})).sort((a,b)=>a.code.localeCompare(b.code)||a.edinetCode.localeCompare(b.edinetCode));
 const stamp=rows[0].join(" ").match(/(\d{4})年(\d{1,2})月(\d{1,2})日/),sourceDate=stamp?stamp[1]+"-"+stamp[2].padStart(2,"0")+"-"+stamp[3].padStart(2,"0"):null;
 if(!universe.length||new Set(universe.map(i=>i.code)).size!==universe.length)throw new Error("Issuer identity ambiguous");
 return {universe,sourceDate,archiveSha:hash(result.bytes)};
 }
 let identity=await identities(),index=structuredClone(require("../server/stock-analysis/edinet-filings.json"));
 if(!index.coveredThrough||index.coveredThrough>asOf||Date.parse(asOf)-Date.parse(index.coveredThrough)>7*86400000)throw new Error("Refresh contiguous filing index first.");
 async function list(date){const r=await http.json("https://api.edinet-fsa.go.jp/api/v2/documents.json?date="+date+"&type=2&Subscription-Key="+encodeURIComponent(key),"list."+date,0);if(String(r.data?.metadata?.status)!=="200"||!Array.isArray(r.data.results))throw new Error("Official list unavailable");return r.data.results;}
 let dayRows=[];for(let d=index.coveredThrough;d<=asOf;d=next(d)){const rows=await list(d);index.filings=mergeEdinetRows(index.filings,rows);if(d===asOf)dayRows=rows;}
 index.coveredThrough=asOf;
 const adapterVersion='growth-research-adapter/2026-10-02/1';
 const fingerprint=()=>digest({universe:identity.universe,filings:[...index.filings].sort((a,b)=>a.docID.localeCompare(b.docID)),ruleVersion:selectionVersion,parserVersion,adapterVersion});
 const dayDigest=rows=>digest([...rows].sort((a,b)=>String(a.docID).localeCompare(String(b.docID))));
 const snapshotId=fingerprint(),checkpoint=path.join(out,"checkpoint.json");
 let run=fs.existsSync(checkpoint)?JSON.parse(fs.readFileSync(checkpoint,"utf8")):null;
 if(!run||run.manifest.snapshotId!==snapshotId||run.manifest.universeAsOf!==identity.sourceDate){
 run={universe:identity.universe,audits:[],comparisons:[],complete:false,current:false,manifest:{universeAsOf:identity.sourceDate,filingCoverageThrough:asOf,runStartedAt:start,runCompletedAt:null,ruleVersion:selectionVersion,parserVersion,snapshotId,candidateEvidenceRefs:[],remainingUnknowns:["Universe is EDINET domestic listed issuers; stock class/exchange completeness unverified","Guidance/revision narrative sources unavailable","Master Business/Risk/Counter-Thesis verification unavailable"],coverage:{identityChecked:identity.universe.length,filingChecked:0,parserVerified:0,discoveryEvidenceChecked:0,masterReviewed:0,publicEligible:0,processed:0}}};}
 const rows=universeFilings(identity.universe,index,asOf);run.manifest.coverage.filingChecked=rows.filter(r=>r.filingAvailable).length;
 const processed=new Set(run.audits.map(a=>a.identity.edinetCode+"|"+a.identity.code));
 // One shared PrimaryHttp queue globally gates every provider HTTP request in this scanner.
 const queuedFetch=async(url,init)=>{const result=await http.get(String(url),"provider."+hash(String(url)),0,init?.headers??{});return new Response(result.bytes,{status:200});};
 const collector=new EvidenceCollector();
 const provider=new EdinetProvider(key,index,collector.wrap(queuedFetch),()=>new Date(),0);let count=0;
 run.radarInputs??=[];
 for(const row of rows){const id=row.identity.edinetCode+"|"+row.identity.code;if(processed.has(id))continue;if(count>=max)break;
 let audit;
 let radarInput={identity:{companyId:row.identity.edinetCode,securityCode:row.identity.code,name:row.identity.name},identityVerified:true,
 evaluationPeriod:row.latestAnnual??"",latestDocumentIds:row.latestDocuments,evaluatedAt:new Date().toISOString(),sources:[],conflicts:["PRIMARY_SOURCE_UNAVAILABLE"]};
 if(!row.filingAvailable)audit={identity:row.identity,report:null,latestAnnual:row.latestAnnual,latestDocuments:row.latestDocuments,parserValid:false,observations:[],errors:["LATEST_FORMAL_ANNUAL_UNAVAILABLE"],remainingUnknowns:[]};
 else try{
 const company=await provider.company({symbol:row.identity.code+".JP",code:row.identity.code,edinetCode:row.identity.edinetCode,name:row.identity.name,country:"JP",currency:null,exchange:"JP"});
 const bundle=collector.bundle(company);
 radarInput=radarInputFromCompany(company,bundle,row.latestDocuments,new Date().toISOString());
 audit=deepResearchCompany(row.identity,company,bundle,row.latestAnnual,row.latestDocuments,radarInput);
 }catch(error){if(["RATE_LIMITED","CONFIGURATION_REQUIRED"].includes(error?.code))throw error;
 audit={identity:row.identity,report:null,latestAnnual:row.latestAnnual,latestDocuments:row.latestDocuments,parserValid:false,observations:[],errors:[error?.code??"DATA_PROVIDER_ERROR"],remainingUnknowns:["Company acquisition/identity/parser not verified"]};}
 save(path.join(out,id.replace("|","-")+".json"),audit);
 save(path.join(out,id.replace("|","-")+"-radar.json"),evaluateRadar(radarInput));
 run.radarInputs.push(radarInput);
 if(audit.parserValid)run.manifest.coverage.parserVerified++;
 if(audit.observations.filter(o=>o.values.length>=3&&o.values.every(v=>v!==null)).length>=2)run.manifest.coverage.discoveryEvidenceChecked++;
 // Private snapshot retains formal review output; the public projector only exposes eligible cards.
 run.audits.push(audit);
 run.manifest.coverage.processed=run.audits.length;save(checkpoint,run);count++;
 console.log(JSON.stringify({processed:run.audits.length,total:run.universe.length,parserVerified:run.manifest.coverage.parserVerified,reportsSaved:run.audits.filter(a=>a.report).length}));
 }
 // Re-read same-day identity/day metadata before currentness proof. Any change invalidates publication.
 const verified=await identities(),updates=await list(asOf);index.filings=mergeEdinetRows(index.filings,updates);
 const same=digest(verified.universe)===digest(identity.universe)&&fingerprint()===snapshotId&&dayDigest(updates)===dayDigest(dayRows)&&today()===asOf;
 run.manifest.freshnessProof={identityArchiveSha:verified.archiveSha,dayListSha:dayDigest(updates),day:asOf};
 run.complete=run.audits.length===run.universe.length;run.current=same&&verified.sourceDate===asOf;
 run.manifest.runCompletedAt=run.complete?new Date().toISOString():null;
 if(!same)run.manifest.remainingUnknowns.push("Universe/filing change during scan; rerun required");
 const {radarInputs,...selectionRun}=run;
 const snapshot={version:snapshotVersion,generatedAt:new Date().toISOString(),selectionRun,inputs:radarInputs};
 const result=await saveGrowthSnapshot({put:async(_key,value)=>save(path.join(out,"growth-snapshot.json"),JSON.parse(value))},snapshot);
 // Public projection intentionally omits private rule/provenance traces; never replace the private manifest with it.
 run.manifest.coverage=result.manifest.coverage;save(checkpoint,run);save(path.join(out,"selection-run.json"),selectionRun);save(path.join(out,"featured-result.json"),result);
 console.log(JSON.stringify({state:result.state,candidateCount:result.candidateCount,entries:result.entries.length,coverage:result.manifest.coverage,output:".stock-test-output/growth-radar-discovery/featured-result.json",published:false}));
 }finally{if(lock!==undefined)fs.closeSync(lock);fs.unlinkSync(path.join(out,"run.lock"));}
})().catch(()=>{console.error("Discovery stopped. Completed audits are retained; verify official access, source versions and server configuration. No secret URLs/errors are printed; no retry or publication occurred.");process.exitCode=1;});
