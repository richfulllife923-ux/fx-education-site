import {currentFacts,ofKind,sole,strings,type NormalizedEvidence,type StructuredFact,type Relation} from "./model";
const text=(v:unknown)=>typeof v==="string"&&!!v.trim();
function one(facts:StructuredFact[],kind:StructuredFact["kind"],key:string,value:unknown){const list=ofKind(facts,kind).filter(f=>f.fields[key]===value);return list.length===1?list[0]:undefined;}
function relation(id:string,rule:Relation["rule"],facts:StructuredFact[],fields:Record<string,unknown>):Relation{
 return {id,rule,factRefs:[...new Set(facts.map(f=>f.id))],fields};
}
export function buildBusinessRelations(n:NormalizedEvidence):Relation[]{
 const facts=currentFacts(n),scope=sole(facts,"BusinessScope"),ids=strings(scope?.fields.businessIds);
 if(n.rejected.length||!scope||scope.fields.complete!==true||!ids.length||new Set(ids).size!==ids.length)return [];
 const output:Relation[]=[];
 for(const businessId of ids){
  const unit=one(facts,"BusinessUnit","businessId",businessId);
  const failure=one(facts,"BusinessFailure","businessId",businessId);
  if(unit&&failure&&failure.fields.materiality==="MAJOR"&&text(failure.fields.basis)&&["CONTRADICTION","LOST","IMPOSSIBLE"].includes(String(failure.fields.state)))
   output.push(relation("R11/failure/"+businessId,"R11",[scope,unit,failure],{failure:true,businessId}));
  const chain=one(facts,"SegmentRelation","businessId",businessId);
  if(!unit||!text(unit.fields.name)||!chain||chain.fields.explicit!==true)continue;
  const links=(["product","customer","revenue","profit"] as const).map((key,i)=>facts.find(f=>f.id===chain.fields[key]&&f.kind===["ProductOrService","CustomerOrMarket","RevenueSource","ProfitDriver"][i]&&text(f.fields.name)));
  if(links.some(f=>!f))continue;
  output.push(relation("R11/chain/"+businessId,"R11",[scope,unit,chain,...links as StructuredFact[]],{businessId,complete:true,scopeSize:ids.length}));
 }
 return output;
}
export function buildCashRelations(n:NormalizedEvidence):Relation[]{
 if(n.rejected.length)return [];
 const kinds=["NetIncome","OperatingCashFlow","Capex","FreeCashFlow"] as const;
 const financial=n.facts.filter(f=>kinds.includes(f.kind as typeof kinds[number]));
 const periods=[...new Set(financial.map(f=>String(f.fields.period)))].sort();
 if(periods.length<3||periods.at(-1)!==n.bundle.latestAnnual.fiscalPeriod)return [];
 const output:Relation[]=[];let currency:unknown;
 for(const [i,period]of periods.entries()){
  if(i){const days=(Date.parse(period)-Date.parse(periods[i-1]))/86400000;if(days<330||days>400)return [];}
  const values=kinds.map(kind=>one(financial,kind,"period",period));
  if(values.some(f=>!f))return [];
  const bound=values as StructuredFact[],[ni,ocf,capex,fcf]=bound;
  currency??=ni.fields.currency;
  if(bound.some(f=>f.fields.currency!==currency)||Number(capex.fields.value)<0||Number(fcf.fields.value)!==Number(ocf.fields.value)-Number(capex.fields.value))return [];
  output.push(relation("R12/period/"+period,"R12",bound,{period,netIncome:ni.fields.value,ocf:ocf.fields.value,fcf:fcf.fields.value}));
 }
 const current=currentFacts(n),explanation=sole(current,"CashFlowExplanation"),oneOff=sole(current,"OneOffFact");
 if(!explanation||!oneOff||periods.some(p=>!strings(explanation.fields.periods).includes(p)||!strings(oneOff.fields.periods).includes(p)))return output;
 output.push(relation("R12/explanation","R12",[explanation,oneOff,...financial],{
  cashConversion:explanation.fields.cashConversion,deterioration:explanation.fields.deterioration,oneOff:oneOff.fields.role}));
 return output;
}
export function buildRiskRelations(n:NormalizedEvidence):Relation[]{
 if(n.rejected.length)return [];
 const current=currentFacts(n),scope=sole(current,"RiskScope"),ids=strings(scope?.fields.riskIds);
 if(!scope||scope.fields.complete!==true||!ids.length||new Set(ids).size!==ids.length)return [];
 const output:Relation[]=[];
 for(const riskId of ids){
  const risk=one(n.facts,"RiskFact","riskId",riskId),impact=one(current,"CurrentImpact","riskId",riskId),response=one(current,"CompanyResponse","riskId",riskId);
  if(!risk||!text(risk.fields.category)||!["MAJOR","NON_MAJOR"].includes(String(risk.fields.materiality))||!text(risk.fields.materialityBasis))continue;
  const mitigation=one(current,"MitigationEvidence","riskId",riskId),resolution=one(current,"ResolutionEvidence","riskId",riskId);
  const resolved=!!resolution&&resolution.fields.previous===risk.id&&resolution.fields.state==="ENDED"&&resolution.metadata.filingDate>risk.metadata.filingDate;
  if(!current.includes(risk)&&!resolved)continue;
  output.push(relation("R13/risk/"+riskId,"R13",[scope,risk,...[impact,response,mitigation,resolution].filter((f):f is StructuredFact=>!!f)],
   {riskId,category:risk.fields.category,materiality:risk.fields.materiality,state:resolved?"RESOLVED":risk.fields.state==="RESOLVED"?"UNVERIFIED":risk.fields.state,
    impact:resolved?"ENDED":impact?.fields.state,response:resolved?"ENDED":response?.fields.state,effect:mitigation?.fields.effect,
    resolutionInvalid:!!resolution&&!resolved,scopeSize:ids.length}));
 }
 return output;
}
export function buildCounterRelations(n:NormalizedEvidence):Relation[]{
 if(n.rejected.length)return [];
 const facts=currentFacts(n),output:Relation[]=[];
 for(const r of ofKind(facts,"ThesisRelation")){
  const primary=facts.find(f=>f.id===r.fields.primary&&f.kind==="PrimaryThesisFact"&&text(f.fields.claim));
  const counter=facts.find(f=>f.id===r.fields.counter&&f.kind==="CounterThesisFact"&&text(f.fields.claim));
  const state=one(facts,"CounterEvidenceState","counter",r.fields.counter);
  if(!primary||!counter||!state||!["WEAKENS","CONTRADICTS"].includes(String(r.fields.relation))||
   !["MAJOR","NON_MAJOR"].includes(String(r.fields.materiality))||!text(r.fields.materialityBasis))continue;
  const competing=ofKind(facts,"ThesisRelation").filter(f=>f.fields.primary===r.fields.primary&&f.fields.counter===r.fields.counter);
  if(competing.length!==1)continue;
  output.push(relation("R14/counter/"+counter.id,"R14",[primary,counter,r,state],
   {primaryId:primary.id,primary:primary.fields.claim,counter:counter.fields.claim,counterId:counter.id,state:state.fields.state,materiality:r.fields.materiality,coreImpact:r.fields.coreImpact}));
 }
 return output;
}

