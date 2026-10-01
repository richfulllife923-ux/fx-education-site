/** Owner Summary Score v1 consumer arithmetic. Never feeds Research Status or Top3. */
export const summaryScoreVersion = "summary-score/1/2026-10-01";
export const summaryDimensions = [
  {id:"business",label:"事業理解",weight:15}, {id:"profitability",label:"収益性",weight:15},
  {id:"cashFlow",label:"Cash Flow",weight:20}, {id:"growth",label:"成長性",weight:15},
  {id:"financialHealth",label:"財務健全性",weight:15}, {id:"risk",label:"リスク",weight:10},
  {id:"valuation",label:"企業価値",weight:10},
] as const;
export type SummaryDimensionId = typeof summaryDimensions[number]["id"];
export type ScoringState = "MET" | "PARTIAL" | "NOT_MET" | "UNVERIFIED";
export type ScoringCriterion = {id:string;state:ScoringState;weight:number;reason:string;evidenceRefs:string[]};
export type SummaryScoreInput = Partial<Record<SummaryDimensionId,ScoringCriterion[]>>;
export type SummaryDisplay = "UNSCORED" | "PROVISIONAL" | "NORMAL";
export type SummaryDimension = {id:SummaryDimensionId;label:string;weight:number;score:number|null;criterionCoverage:number;
  complete:boolean;criteria:ScoringCriterion[];evidenceRefs:string[]};
export type SummaryScoreResult = {version:string;score:number|null;verifiedScore:number|null;coverage:number;display:SummaryDisplay;
  dimensions:SummaryDimension[];issues:string[]};
export function scoreStatePoints(state:ScoringState):number|null {
  return state==="MET"?100:state==="PARTIAL"?60:state==="NOT_MET"?0:null;
}
/** Gates use unrounded coverage. Integer formatting is a separate presentation step. */
export function summaryDisplayGate(coverage:number):SummaryDisplay {
  return !Number.isFinite(coverage)||coverage<60?"UNSCORED":coverage<80?"PROVISIONAL":"NORMAL";
}
export function evaluateSummaryScore(input:SummaryScoreInput):SummaryScoreResult {
  const issues:string[]=[];
  const prepared=summaryDimensions.map(d=>{
    const byId=new Map<string,ScoringCriterion>();let invalid=false;
    for(const c of input[d.id]??[]) {
      if(!c.id||!Number.isFinite(c.weight)||c.weight<=0){invalid=true;issues.push("INVALID_CRITERION_CONTRACT/"+d.id);continue;}
      const clean={...c,evidenceRefs:[...new Set(c.evidenceRefs.filter(r=>typeof r==="string"&&!!r.trim()))].sort()};
      const prior=byId.get(c.id);
      if(prior&&JSON.stringify(prior)!==JSON.stringify(clean)){invalid=true;issues.push("CONFLICTING_CRITERION/"+d.id+"/"+c.id);}
      else byId.set(c.id,clean);
    }
    return {dimension:d,criteria:[...byId.values()],invalid};
  });
  const owners=new Map<string,Set<string>>();
  for(const p of prepared)for(const c of p.criteria)if(scoreStatePoints(c.state)!==null)
    for(const ref of c.evidenceRefs){const ids=owners.get(ref)??new Set<string>();ids.add(p.dimension.id+"/"+c.id);owners.set(ref,ids);}
  const duplicates=new Set([...owners].filter(([,ids])=>ids.size>1).map(([ref])=>ref));
  if(duplicates.size)issues.push("DUPLICATE_EVIDENCE: "+[...duplicates].join(", "));
  const dimensions:SummaryDimension[]=prepared.map(p=>{
    const criteria=p.criteria.map(c=>{
      const invalid=p.invalid||!c.reason.trim()||!c.evidenceRefs.length||c.evidenceRefs.some(r=>duplicates.has(r));
      return {...c,state:invalid?"UNVERIFIED" as const:c.state};
    });
    let totalWeight=0,verifiedWeight=0,sum=0;
    for(const c of criteria){totalWeight+=c.weight;const points=scoreStatePoints(c.state);if(points!==null){verifiedWeight+=c.weight;sum+=points*c.weight;}}
    return {...p.dimension,score:verifiedWeight?sum/verifiedWeight:null,
      criterionCoverage:totalWeight?verifiedWeight/totalWeight*100:0,complete:totalWeight>0&&verifiedWeight===totalWeight,
      criteria,evidenceRefs:[...new Set(criteria.filter(c=>scoreStatePoints(c.state)!==null).flatMap(c=>c.evidenceRefs))]};
  });
  const verified=dimensions.filter(d=>d.score!==null),verifiedWeight=verified.reduce((s,d)=>s+d.weight,0);
  const coverage=verifiedWeight/100*100,verifiedScore=verifiedWeight?verified.reduce((s,d)=>s+d.score!*d.weight,0)/verifiedWeight:null;
  const display=summaryDisplayGate(coverage);
  return {version:summaryScoreVersion,score:display==="UNSCORED"||verifiedScore===null?null:Math.round(verifiedScore),verifiedScore,
    coverage,display,dimensions,issues};
}
