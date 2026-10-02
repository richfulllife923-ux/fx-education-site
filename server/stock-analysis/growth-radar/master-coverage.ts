import {masterCurrentSha,type MasterReview} from "../../../lib/top3-selection";
import type {StockReport,Evidence,SectionId} from "../../../lib/stock-analysis";

export type MasterCoverageSection={number:number;name:string;status:"COMPLETE"|"PARTIAL"|"UNVERIFIED";
 formalState:string|null;missingItems:string[];evidenceRefs:string[];auditRef:string};
export type MasterCoverage={sections:MasterCoverageSection[];completedSections:number;partialSections:number;unverifiedSections:number;
 missingItems:string[];evidenceRefs:string[];coverage:number;finalResearchState:string|null;
 /** An audit receipt records an inspected result, including a formal UNVERIFIED result. It is NOT primary evidence. */
 auditRecords:Record<string,{kind:"COVERAGE_AUDIT";section:number;status:MasterCoverageSection["status"];sourceEvidenceRefs:string[];missingItems:string[]}>};
const mapping:[string,SectionId[]][]=[
 ['Business Understanding',['business','revenue']],['Industry / Value Chain',['company']],['Moat',['business']],
 ['Management / Capital Allocation',['finance']],['Multi-Year Financials',['performance']],['Latest Earnings / Earnings Momentum',['earnings','growth']],
 ['Quality of Earnings',['cash-flow']],['Balance Sheet / Debt Quality',['finance']],['FCF / Owner Earnings',['cash-flow']],
 ['Growth Quality',['growth']],['Sector-Specific Metrics',['performance']],['Macro / Sector Sensitivity',['scenarios']],
 ['Shareholder Returns',['finance']],['Expectations / Catalyst',['growth','earnings']],['Valuation',['valuation']],
 ['Intrinsic Value Range',['valuation']],['Why Is It Cheap / Expensive?',['valuation']],['Price / Momentum / Volume',['valuation']],
 ['Counter-Thesis',['risk','scenarios']],['Bull / Base / Bear',['scenarios']],['Portfolio / Risk',['risk']],
 ['Conditional Price Review Zones',['valuation']],['Next Earnings Checklist',['earnings']],['Evidence Register',['notes']],['Final Research State',['notes']]
];
export function masterCoverage(report:StockReport):MasterCoverage{
 const all=Object.values(report.sections).flat().filter((e):e is Evidence=>!!e);
 const records:MasterCoverage['auditRecords']={};
 const sections=mapping.map(([name,ids],index):MasterCoverageSection=>{
  const number=index+1,entries=number===25?[]:ids.flatMap(id=>report.sections[id]??[]);
  const facts=entries.filter(e=>['FACT','CALCULATION','SOURCE CLAIM'].includes(e.kind)&&e.confidence!=="UNVERIFIED"&&!!e.sourceUrl&&!!e.field);
  const formal=number===1?report.researchEvidence?.business:number===9?report.researchEvidence?.cashFlowSustainability:
   number===19?report.researchEvidence?.counterThesis:number===21?report.researchEvidence?.majorRisk:undefined;
  const refs=[...new Set([...facts.map(e=>e.sourceUrl+'#'+e.field),...(formal?.evidenceRefs??[])])];
  // Canonical numbers can support a section; they never establish a complete qualitative review.
  const status:MasterCoverageSection['status']=formal?.status==='MET'?'COMPLETE':formal?.status==='PARTIAL'||refs.length?'PARTIAL':'UNVERIFIED';
  const missingItems=status==='COMPLETE'?[]:[...(formal?.missingItems??[]),...entries.filter(e=>e.kind==='UNKNOWN').map(e=>e.label),name+'の詳細確認は未完了'];
  const auditRef='coverage-audit:'+report.symbol+':'+(report.metadata?.fiscalDate??'unknown')+':'+number;
  records[auditRef]={kind:'COVERAGE_AUDIT',section:number,status,sourceEvidenceRefs:refs,missingItems};
  return {number,name,status,formalState:formal?.status??null,missingItems,evidenceRefs:refs,auditRef};
 });
 const completedSections=sections.filter(s=>s.status==='COMPLETE').length,partialSections=sections.filter(s=>s.status==='PARTIAL').length;
 return {sections,completedSections,partialSections,unverifiedSections:25-completedSections-partialSections,
  missingItems:[...new Set(sections.flatMap(s=>s.missingItems))],evidenceRefs:[...new Set(all.filter(e=>e.kind!=='UNKNOWN'&&e.field).map(e=>e.sourceUrl+'#'+e.field))],
  coverage:completedSections/25*100,finalResearchState:report.researchStatus?.existingResearchState??null,auditRecords:records};
}
/** Legacy MasterReview is an audit completion receipt, NOT a claim that all 25 subjects are MET.
 * Actual missing primary facts stay in remainingUnknowns and the attached typed coverage record.
 * No synthetic primary-source reference is invented: coverage-audit refs resolve to auditRecords only.
 */
export function masterReviewReceipt(report:StockReport,coverage:MasterCoverage):MasterReview{
 const e=report.researchEvidence;
 const gaps=([['business','Business'],['cashFlowSustainability','CF'],['majorRisk','Major Risk'],['counterThesis','Counter-Thesis']] as const)
  .filter(([key])=>!e||!(e[key].status==='MET'||key==='business'&&e[key].status==='PARTIAL')).map(([,name])=>name+' formal evidence unresolved');
 return {masterSha:masterCurrentSha,companySymbol:report.symbol,fiscalDate:report.metadata?.fiscalDate??'',
  sections:coverage.sections.map(s=>({number:s.number,reviewed:true,evidenceRefs:[s.auditRef],remainingUnknowns:[...s.missingItems]})),unresolvedMajorGaps:gaps};
}
