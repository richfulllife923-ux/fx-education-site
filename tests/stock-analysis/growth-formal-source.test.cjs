// Synthetic canonical facts; never loaded by production discovery.
require('./register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {company:radarCompany}=require('./growth-pipeline-fixtures.cjs');
const {adaptCanonicalConditions}=require('../../server/stock-analysis/growth-radar/formal-source.ts');
const {researchInput}=require('../../server/stock-analysis/research-status.ts');
const {adaptEvidence}=require('../../server/stock-analysis/research-evidence/adapter.ts');
const {evaluateResearchStatus}=require('../../lib/research-status.ts');
function canonical(){
 const {audit,input}=radarCompany(),source=input.sources[0];
 const annual=['2026-03-31','2025-03-31','2024-03-31'].map(end=>{
  const p={end,basis:'annual',currency:'JPY'};
  for(const key of ['revenue','operatingIncome','netIncome','operatingCF','capex','debt','equity','assets','cash'])p[key]={value:100,source:{provider:'EDINET',url:source.url,title:'TEST DATA',retrievedAt:input.evaluatedAt,field:key,period:end,basis:'annual',unit:'currency',currency:'JPY',classification:'FACT'}};
  return p;
 });
 const company={identity:{code:audit.identity.code,symbol:audit.identity.code+'.JP',edinetCode:audit.identity.edinetCode,name:'TEST DATA'},provider:'EDINET',primarySource:{classification:'FACT'},annual,filings:[{period:annual[0].end}],valuationStatus:'LIMITED',quote:null};
 return {company,input,evidence:audit.report.researchEvidence};
}
const inputFor=f=>adaptCanonicalConditions(adaptEvidence(researchInput(f.company,'EMERGING'),f.evidence),f.company,f.input);
test('canonical financials pass without new rate thresholds; debt alone does not clear risk',()=>{
 const f=canonical();f.evidence.majorRisk.status='UNVERIFIED';const before=JSON.stringify(f.company),r=inputFor(f);
 assert.equal(r.conditions.financials.state,'MET');assert.equal(r.conditions.balanceSheet.state,'UNVERIFIED');assert.equal(r.majorRisk,'UNVERIFIED');assert.equal(JSON.stringify(f.company),before);
});
test('current change without multi-period source continuity cannot be formal Growth MET',()=>{
 const f=canonical(),r=inputFor(f);assert.equal(r.conditions.growth.state,'UNVERIFIED');assert.equal(evaluateResearchStatus(r).status,'STAY');
});
test('same primary causal structure in distinct periods can bind formal growth; valuation-only STAY',()=>{
 const f=canonical(),s=f.input.sources[0];f.input.sources.push({...s,id:'prior-source',documentId:'S100PRIO',url:'https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100PRIO',period:'2025-03-31',filingDate:'2025-06-01'});
 const r=inputFor(f);assert.equal(r.conditions.growth.state,'MET');assert.ok(r.conditions.growth.evidenceRefs.length>=2);
 const status=evaluateResearchStatus(r);assert.equal(status.status,'STAY');assert.ok(status.ruleTrace.filter(t=>t.result==='PENDING').every(t=>['R4','R10'].includes(t.ruleId)));
});
test('unrelated prior claim or wrong issuer never proves continuity',()=>{
 for(const patch of [{text:'営業CFは増加した。'},{companyId:'E99999'}]){
  const f=canonical(),s=f.input.sources[0];f.input.sources.push({...s,id:'prior-source',documentId:'S100PRIO',url:'https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100PRIO',period:'2025-03-31',filingDate:'2025-06-01',...patch});assert.notEqual(inputFor(f).conditions.growth.state,'MET');
 }
});
test('missing debt is GRAY; missing OCF/FCF is not silently replaced by zero',()=>{
 for(const key of ['debt','operatingCF','capex']){const f=canonical();f.company.annual[0][key].value=null;const r=inputFor(f),s=evaluateResearchStatus(r);assert.equal(s.status,'GRAY');assert.notEqual(key==='debt'?r.debt:key==='operatingCF'?r.operatingCF:r.freeCF,'AVAILABLE');}
});
test('non-comparable annual currency does not certify financials',()=>{
 const f=canonical();f.company.annual[1].revenue.source.currency='USD';assert.notEqual(inputFor(f).conditions.financials.state,'MET');
});
