/** Server-only proof model. No public request body is accepted as an EvidenceBundle. */
export const evidenceRuleVersion="R11-R14/2026-10-01/evidence-first/1";
export const evidenceConstitutionSha="e3fa28847c3d4e96b255b29ef5f94aec530c3ffaaaad5464c06c10f29c9c38fc";
export type EvidenceState="MET"|"PARTIAL"|"NOT_MET"|"UNVERIFIED";
export type FactKind="BusinessScope"|"BusinessUnit"|"ProductOrService"|"CustomerOrMarket"|"RevenueSource"|"ProfitDriver"|"SegmentRelation"|"MinorDetailGap"|"BusinessFailure"|
 "NetIncome"|"OperatingCashFlow"|"Capex"|"FreeCashFlow"|"Debt"|"CashFlowExplanation"|"OneOffFact"|
 "RiskScope"|"RiskFact"|"CurrentImpact"|"CompanyResponse"|"MitigationEvidence"|"ResolutionEvidence"|
 "PrimaryThesisFact"|"CounterThesisFact"|"ThesisRelation"|"CounterEvidenceState";
export type Fragment={id:string;kind:FactKind|null;fields?:Record<string,unknown>;text?:string;heading:string;location:string;
 retrievedAt?:string; structure:"TEXT_ONLY"|"CANONICAL_FINANCIAL"|"EXPLICIT_PRIMARY_STRUCTURE";confidence:"CONFIRMED"|"UNVERIFIED"};
export type EvidenceDocument={companyId:string;securityCode:string;documentId:string;sourceType:"EDINET";
 url:string;fiscalPeriod:string;filingDate:string;retrievedAt:string;parserVersion:string;fragments:Fragment[]};
export type EvidenceBundle={identity:{companyId:string;securityCode:string;symbol:string};
 latestAnnual:{documentId:string;fiscalPeriod:string;verified:boolean};documents:EvidenceDocument[]};
export type FactMetadata={companyId:string;securityCode:string;documentId:string;sourceType:string;sourceHeading:string;sourceLocation:string;
 fiscalPeriod:string;filingDate:string;retrievedAt:string;ruleVersion:string;parserVersion:string;confidence:"CONFIRMED";url:string};
export type StructuredFact={id:string;kind:FactKind;fields:Record<string,unknown>;metadata:FactMetadata};
export type NormalizedEvidence={bundle:EvidenceBundle;facts:StructuredFact[];rejected:string[];latestDate:string|null};
export type Relation={id:string;rule:"R11"|"R12"|"R13"|"R14";factRefs:string[];fields:Record<string,unknown>};
export type PredicateTrace={predicate:string;outcome:"PASS"|"FAIL"|"UNVERIFIED";reason:string;factRefs:string[];relationRefs:string[]};
export type EvidenceDecision={status:EvidenceState;reason:string;evidenceRefs:string[];missingItems:string[];confidence:"SUPPORTED"|"UNVERIFIED"|"CONTRADICTED";
 predicateTrace:PredicateTrace[];periodsReviewed?:string[];ocfTrend?:string;fcfTrend?:string;identifiedRisks?:string[];blockingRisks?:string[];
 mitigations?:string[];primaryThesis?:string[];counterTheses?:string[];supportingEvidence?:string[];conflictingEvidence?:string[]};
export type ResearchEvidenceResult={ruleVersion:string;fiscalDate:string|null;business:EvidenceDecision;cashFlowSustainability:EvidenceDecision;majorRisk:EvidenceDecision;counterThesis:EvidenceDecision;
 coverage:{business:boolean;cashFlow:boolean;risk:boolean;counterThesis:boolean};sourceCandidates:number;structuredFacts:number;relations:number;
 provenance:Record<string,FactMetadata>;extractionIssues:string[]};
const kinds=new Set<FactKind>(["BusinessScope","BusinessUnit","ProductOrService","CustomerOrMarket","RevenueSource","ProfitDriver","SegmentRelation","MinorDetailGap","BusinessFailure",
 "NetIncome","OperatingCashFlow","Capex","FreeCashFlow","Debt","CashFlowExplanation","OneOffFact","RiskScope","RiskFact","CurrentImpact","CompanyResponse","MitigationEvidence","ResolutionEvidence",
 "PrimaryThesisFact","CounterThesisFact","ThesisRelation","CounterEvidenceState"]);
const numeric=new Set<FactKind>(["NetIncome","OperatingCashFlow","Capex","FreeCashFlow","Debt"]);
export function isoDate(value:unknown):value is string{
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
function sourceValid(doc:EvidenceDocument,b:EvidenceBundle):boolean{
 try{const u=new URL(doc.url);return doc.sourceType==="EDINET"&&u.protocol==="https:"&&u.hostname==="disclosure2.edinet-fsa.go.jp"&&
 u.pathname==="/WZEK0040.aspx"&&u.search==="?"+doc.documentId&&!u.username&&!u.password&&/^S[A-Z0-9]{7}$/.test(doc.documentId)&&
 doc.companyId===b.identity.companyId&&doc.securityCode===b.identity.securityCode&&isoDate(doc.fiscalPeriod)&&isoDate(doc.filingDate)&&
 !!doc.parserVersion&&Number.isFinite(Date.parse(doc.retrievedAt))&&doc.retrievedAt.slice(0,10)>=doc.filingDate;
 }catch{return false;}
}
/** The extractor must supply typed structure. Text and headings never become facts here. */
export function normalizeFacts(bundle:EvidenceBundle):NormalizedEvidence{
 const facts:StructuredFact[]=[],rejected:string[]=[],seen=new Set<string>();
 const latest=bundle.documents.find(d=>d.documentId===bundle.latestAnnual.documentId);
 if(!bundle.latestAnnual.verified||!isoDate(bundle.latestAnnual.fiscalPeriod)||!latest||latest.fiscalPeriod!==bundle.latestAnnual.fiscalPeriod||
 !bundle.identity.companyId||!bundle.identity.securityCode||!sourceValid(latest,bundle))
 return {bundle,facts,rejected:["latest annual identity/period/source binding unavailable"],latestDate:null};
 for(const doc of bundle.documents){
  if(!sourceValid(doc,bundle)){rejected.push("document identity/period/source binding rejected");continue;}
  if(!Array.isArray(doc.fragments)||doc.fragments.length>1024){rejected.push("fragment bounds rejected");continue;}
  for(const f of doc.fragments){
   if(f.structure==="TEXT_ONLY"||f.kind===null)continue;
   if(!kinds.has(f.kind)||!f.id||seen.has(f.id)||!f.fields||!f.heading||!f.location||f.confidence!=="CONFIRMED"||
    (!numeric.has(f.kind)&&f.structure!=="EXPLICIT_PRIMARY_STRUCTURE")){rejected.push("structured fact/provenance unavailable");continue;}
   if(numeric.has(f.kind)&&(!Number.isFinite(f.fields.value)||!isoDate(f.fields.period)||f.fields.period>bundle.latestAnnual.fiscalPeriod||
     f.fields.basis!=="annual"||!isoDate(f.fields.start)||typeof f.fields.currency!=="string"||!/^[A-Z]{3}$/.test(f.fields.currency))) {
    rejected.push("financial period/currency/basis unavailable");continue;
   }
   seen.add(f.id);
   facts.push({id:f.id,kind:f.kind,fields:structuredClone(f.fields),metadata:{companyId:doc.companyId,securityCode:doc.securityCode,documentId:doc.documentId,
    sourceType:doc.sourceType,sourceHeading:f.heading,sourceLocation:f.location,fiscalPeriod:numeric.has(f.kind)?String(f.fields.period):doc.fiscalPeriod,
    filingDate:doc.filingDate,retrievedAt:f.retrievedAt??doc.retrievedAt,ruleVersion:evidenceRuleVersion,parserVersion:doc.parserVersion,confidence:"CONFIRMED",url:doc.url}});
  }
 }
 return {bundle,facts,rejected,latestDate:latest.filingDate};
}
export function currentFacts(n:NormalizedEvidence):StructuredFact[]{
 return n.facts.filter(f=>f.metadata.documentId===n.bundle.latestAnnual.documentId ||
  (n.latestDate!==null&&f.metadata.filingDate>n.latestDate&&f.metadata.fiscalPeriod>=n.bundle.latestAnnual.fiscalPeriod));
}
export function ofKind(facts:StructuredFact[],kind:FactKind){return facts.filter(f=>f.kind===kind);}
export function sole(facts:StructuredFact[],kind:FactKind):StructuredFact|undefined{
 const list=ofKind(facts,kind);return list.length===1?list[0]:undefined;
}
export function strings(value:unknown):string[]{return Array.isArray(value)&&value.every(v=>typeof v==="string"&&v.trim())?[...value]:[];}

