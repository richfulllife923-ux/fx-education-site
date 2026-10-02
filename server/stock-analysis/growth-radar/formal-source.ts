import type {CompanyData,Datum,FinancialPeriod} from '../model';
import type {ResearchStatusInput,Condition} from '../../../lib/research-status';
import type {Evidence} from '../../../lib/stock-analysis';
import type {RadarInput,GrowthRadarCompany,ChangeRelation} from './model';
import {evaluateRadar} from './engine';
const ref=(d:Datum)=>d.source.url+'#'+d.source.field;
function canonical(d:Datum,p:FinancialPeriod):boolean{
 return d.value!==null&&Number.isFinite(d.value)&&d.source.provider==='EDINET'&&d.source.basis==='annual'&&
 d.source.period===p.end&&!!p.currency&&d.source.currency===p.currency&&d.source.unit==='currency'&&!!d.source.field&&!!d.source.url;
}
const condition=(state:Condition['state'],reason:string,evidenceRefs:string[]):Condition=>({state,reason,evidenceRefs});
const signature=(r:ChangeRelation,c:GrowthRadarCompany)=>[r.relationType,...[r.triggerFactId,r.effectFactId].map(id=>{
 const f=c.facts.find(f=>f.id===id)!;return [f.layer,f.direction,f.quote.replace(/\s+/g,' ').trim()];
})];
/** Exact repeated primary claims only. Different wording/relations remain unverified, not fuzzy-matched.
 * Repeated numeric periods by themselves are never a continuity attestation.
 */
export function reviewedGrowth(input:RadarInput):{condition:Condition;evidence:Evidence[]}{
 const current=evaluateRadar(input),evidence:Evidence[]=[];
 if(current.state==='CANDIDATE')for(const r of current.relations){
  const effect=current.facts.find(f=>f.id===r.effectFactId)!;
  // Discovery can observe deterioration too; repeating deterioration is not an Emerging growth qualification.
  if(!['INCREASE','START'].includes(effect.direction))continue;
  const repeated=[...new Set(input.sources.filter(s=>s.period<input.evaluationPeriod).map(s=>s.period))].some(period=>{
   const past=evaluateRadar({...input,evaluationPeriod:period,latestDocumentIds:input.sources.filter(s=>s.period===period).map(s=>s.documentId),comparisons:[]});
   return past.state==='CANDIDATE'&&past.relations.some(p=>JSON.stringify(signature(p,past))===JSON.stringify(signature(r,current)));
  });
  if(!repeated)continue;
  const source=input.sources.find(s=>s.id===r.sourceRef)!;
  for(const id of [r.triggerFactId,r.effectFactId]){
   const f=current.facts.find(f=>f.id===id)!;
   if(evidence.some(e=>e.field===id))continue;
   evidence.push({label:'成長変化',value:f.quote,kind:'SOURCE CLAIM',confidence:'SUPPORTED',sourceTitle:'EDINET',sourceUrl:source.url,
    asOf:source.filingDate,period:source.period,field:id});
  }
 }
 return {condition:evidence.length>=2?condition('MET','同一企業の一次資料で当期の明示的変化関係と複数期間の同構造を確認。',evidence.map(e=>e.field!)):
  condition('UNVERIFIED','当期変化と同構造の継続を結ぶ一次資料Evidenceが未確認です。',[]),evidence};
}
/** Adapts existing canonical completeness and formal reviews; no new rate, debt-ratio or valuation threshold.
 * R11–R14 continue to own quality/risk. Availability alone never clears risk or produces GREEN.
 */
export function adaptCanonicalConditions(input:ResearchStatusInput,company:CompanyData,radar:RadarInput):ResearchStatusInput{
 const conditions={...input.conditions},periods=company.annual,latest=periods[0];
 const financialKeys=['revenue','operatingIncome','netIncome','operatingCF','equity'] as const;
 const comparable=periods.length>=3&&new Set(periods.map(p=>p.end)).size===periods.length&&periods.every((p,i)=>
  p.currency===latest.currency&&financialKeys.every(k=>canonical(p[k],p))&&(!i||Date.parse(periods[i-1].end)-Date.parse(p.end)>=330*86400000&&Date.parse(periods[i-1].end)-Date.parse(p.end)<=400*86400000));
 if(comparable)conditions.financials=condition('MET','正式年度の複数年主要財務と期間・通貨・単位を確認。質的評価はBusiness / CF / Riskの正式結果を使用。',periods.flatMap(p=>financialKeys.map(k=>ref(p[k]))));
 if(latest&&input.debt==='AVAILABLE'&&['debt','equity','assets','cash'].every(k=>canonical(latest[k as 'debt'],latest))&&input.majorRisk==='CLEAR')
  conditions.balanceSheet=condition('MET','Canonical Balance Sheet / D1–D3準拠DebtとR13の正式Risk確認を接続。',[...['debt','equity','assets','cash'].map(k=>ref(latest[k as 'debt'])),...conditions.risk.evidenceRefs]);
 conditions.growth=reviewedGrowth(radar).condition;
 // Without current revenue/profit/equity or either cash-flow measure the required analysis cannot be formed.
 const critical=!!latest&&['revenue','operatingIncome','equity'].some(k=>latest[k as 'revenue'].value===null);
 return {...input,conditions,dataIntegrity:critical?'MAJOR_ISSUE':input.dataIntegrity,
  cashFlowMissingSeverity:input.operatingCF==='MISSING'||input.freeCF==='MISSING'?'MAJOR':input.cashFlowMissingSeverity,
  ownerDecisionsRequired:[]};
}
