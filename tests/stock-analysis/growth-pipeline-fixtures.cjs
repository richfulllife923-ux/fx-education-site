// ISOLATED TEST DATA. Never imported by product code or real discovery.
require('./register.cjs');
const {audit,run}=require('./top3-fixtures.cjs');
function company(code='1111'){
 const a=audit(code),identity={companyId:a.identity.edinetCode,securityCode:code,name:a.identity.name};
 const text='データセンター需要の増加により、SSD売上が増加した。';
 const source={id:'source-'+code,...identity,documentId:'S100TEST',sourceType:'EDINET',url:'https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100TEST',period:a.latestAnnual,filingDate:'2026-06-01',retrievedAt:'2026-10-01T16:00:00Z',heading:'経営成績',location:'TEST DATA text',format:'TEXT',primaryVerified:true,text};
 const input={identity,identityVerified:true,evaluationPeriod:a.latestAnnual,latestDocumentIds:a.latestDocuments,evaluatedAt:'2026-10-01T16:00:00Z',sources:[source]};
 const result={ruleVersion:'R11-R14/2026-10-01/evidence-first/1',fiscalDate:a.latestAnnual,provenance:{},coverage:{business:true,cashFlow:true,risk:true,counterThesis:true},sourceCandidates:4,structuredFacts:4,relations:4,extractionIssues:[]};
 for(const [key,rule] of [['business','R11'],['cashFlowSustainability','R12'],['majorRisk','R13'],['counterThesis','R14']]){
  const id=rule+'-TEST-DATA';result.provenance[id]={companyId:identity.companyId,securityCode:code,documentId:'S100TEST',sourceType:'EDINET',sourceHeading:'TEST DATA',sourceLocation:id,fiscalPeriod:a.latestAnnual,filingDate:'2026-06-01',retrievedAt:input.evaluatedAt,ruleVersion:result.ruleVersion,parserVersion:'TEST DATA',confidence:'CONFIRMED',url:source.url};
  result[key]={status:'MET',reason:rule+' TEST DATA formal review',evidenceRefs:[id],missingItems:[],confidence:'SUPPORTED',predicateTrace:[{predicate:rule+'/TEST-DATA',outcome:'PASS',reason:'TEST DATA',factRefs:[id],relationRefs:[]}],identifiedRisks:key==='majorRisk'?['TEST DATA 顧客集中']:[],blockingRisks:[]};
 }
 a.report.researchEvidence=result;return {audit:a,input};
}
function snapshot(count=1){
 const companies=Array.from({length:count},(_,i)=>company(String(1111+i)));
 const selectionRun=run(companies.map(c=>c.audit));selectionRun.manifest.universeAsOf=selectionRun.manifest.filingCoverageThrough='2026-10-02';
 selectionRun.manifest.runStartedAt='2026-10-01T16:00:00Z';selectionRun.manifest.runCompletedAt='2026-10-01T16:01:00Z';
 selectionRun.manifest.freshnessProof={day:'2026-10-02',identityArchiveSha:'a'.repeat(64),dayListSha:'b'.repeat(64)};
 return {version:'growth-radar-public/1',generatedAt:'2026-10-01T16:02:00Z',selectionRun,inputs:companies.map(c=>c.input)};
}
async function projection(value=snapshot()){
 const {projectSnapshot}=require('../../server/stock-analysis/growth-radar/pipeline.ts');
 const {createPublicationProjection}=require('../../server/stock-analysis/growth-radar/publication-projection.ts');
 return createPublicationProjection(value,{result:projectSnapshot(value,()=>new Date('2026-10-02T00:03:00Z')),sourceGeneration:'ISOLATED-TEST-GENERATION',jev:{pre:'PASS',post:'PASS'}});
}
module.exports={company,snapshot,projection};
