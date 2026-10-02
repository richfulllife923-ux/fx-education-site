// EXPLICIT SYNTHETIC PRIMARY STRUCTURE. Not an actual issuer, never used by product code.
function sourceFixture(){
 const identity={code:'1111',edinetCode:'E01111',name:'TEST DATA integrated issuer',englishName:'',industry:'TEST DATA'};
 const url='https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100TEST',at='2026-10-01T16:00:00Z';
 const source={provider:'EDINET',url,title:'TEST DATA annual filing',retrievedAt:at,asOf:'2026-06-01',basis:'annual',currency:'JPY',unit:'currency',classification:'FACT',accession:'S100TEST'};
 const periods=['2026-03-31','2025-03-31','2024-03-31'];
 const annual=periods.map((end,i)=>{
  const p={end,basis:'annual',currency:'JPY'};
  for(const key of ['revenue','grossProfit','operatingIncome','netIncome','operatingCF','investingCF','financingCF','capex','cash','investments','debt','equity','assets','receivables','inventory','shares','sbc'])
   p[key]={value:key==='capex'?30:key==='operatingCF'?140-i*10:120-i*10,source:{...source,field:key,period:end,start:(Number(end.slice(0,4))-1)+'-04-01'}};
  return p;
 });
 const missing={value:null,source:{...source,period:null,field:'unavailable'}};
 const company={identity:{...identity,symbol:'1111.JP',exchange:'JP',country:'JP',currency:'JPY'},provider:'EDINET',mode:'FREE',valuationStatus:'LIMITED',primarySource:{...source,period:periods[0],field:'annual'},
  description:null,sector:null,industry:'TEST DATA',website:null,cik:null,updatedAt:at,retrievedAt:at,annual,quarterly:[],quote:null,earnings:[],issues:[],
  filings:[{url,title:'TEST DATA',filed:'2026-06-01',period:periods[0],amended:false}],valuation:Object.fromEntries(['pe','pb','evEbitda','ps','epsTTM','marketCap','enterpriseValue','ebitdaTTM'].map(k=>[k,structuredClone(missing)]))};
 const doc={companyId:identity.edinetCode,securityCode:identity.code,documentId:'S100TEST',sourceType:'EDINET',url,fiscalPeriod:periods[0],filingDate:'2026-06-01',retrievedAt:at,parserVersion:'TEST DATA',fragments:[]};
 const bundle={identity:{companyId:identity.edinetCode,securityCode:identity.code,symbol:'1111.JP'},latestAnnual:{documentId:doc.documentId,fiscalPeriod:periods[0],verified:true},documents:[doc]};
 const add=(id,kind,fields)=>doc.fragments.push({id,kind,fields,heading:'TEST DATA structured primary',location:id,structure:'EXPLICIT_PRIMARY_STRUCTURE',confidence:'CONFIRMED'});
 add('scope','BusinessScope',{businessIds:['main'],complete:true});add('main','BusinessUnit',{businessId:'main',name:'TEST DATA main'});
 add('product','ProductOrService',{name:'TEST DATA product'});add('customer','CustomerOrMarket',{name:'TEST DATA customers'});add('revenue','RevenueSource',{name:'TEST DATA sales'});add('profit','ProfitDriver',{name:'TEST DATA margin'});
 add('chain','SegmentRelation',{businessId:'main',product:'product',customer:'customer',revenue:'revenue',profit:'profit',explicit:true});
 for(const [i,period]of periods.entries())for(const [kind,value]of [['NetIncome',120-i*10],['OperatingCashFlow',140-i*10],['Capex',30],['FreeCashFlow',110-i*10]])add(kind+period,kind,{value,period,currency:'JPY',basis:'annual',start:(Number(period.slice(0,4))-1)+'-04-01'});
 add('cf-explanation','CashFlowExplanation',{periods,cashConversion:'CONTINUING',deterioration:'NONE'});add('oneoff','OneOffFact',{periods,role:'NOT_SOLE_DRIVER'});
 add('risk-scope','RiskScope',{riskIds:['issue'],complete:true});add('risk','RiskFact',{riskId:'issue',category:'TEST DATA funding',state:'MITIGATED',materiality:'MAJOR',materialityBasis:'TEST DATA explicit major impact'});
 add('impact','CurrentImpact',{riskId:'issue',state:'NON_MATERIAL'});add('response','CompanyResponse',{riskId:'issue',state:'IMPLEMENTED'});add('effective','MitigationEvidence',{riskId:'issue',effect:'EFFECTIVE'});
 add('thesis','PrimaryThesisFact',{thesisId:'growth',claim:'TEST DATA demand conversion'});add('counter','CounterThesisFact',{counterId:'reversal',claim:'TEST DATA contrary demand evidence'});
 add('relation','ThesisRelation',{primary:'thesis',counter:'counter',relation:'WEAKENS',coreImpact:'NONE',materiality:'MAJOR',materialityBasis:'TEST DATA causal chain'});add('review','CounterEvidenceState',{counter:'counter',state:'NOT_MATERIALIZED'});
 const text={id:'text-current',kind:null,text:'データセンター需要の増加により、SSD売上が増加した。',heading:'経営成績',location:'TEST DATA growth',structure:'TEXT_ONLY',confidence:'CONFIRMED'};
 doc.fragments.push(text);bundle.documents.push({...doc,documentId:'S100PRIO',url:'https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100PRIO',fiscalPeriod:'2025-03-31',filingDate:'2025-06-01',fragments:[{...text,id:'text-prior'}]});
 return {identity,company,bundle,at,documents:['S100TEST']};
}
module.exports={sourceFixture};
