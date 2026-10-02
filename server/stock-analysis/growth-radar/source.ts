import type {CompanyData,Datum} from "../model";
import type {EvidenceBundle} from "../research-evidence/model";
import type {CandidateAudit,UniverseIdentity} from "../../../lib/top3-selection";
import {auditCompany} from "../discovery";
import {adaptEvidence} from "../research-evidence/adapter";
import {evaluateResearchEvidence} from "../research-evidence/evaluators";
import {researchInput} from "../research-status";
import {evaluateResearchStatus} from "../../../lib/research-status";
import {adaptCanonicalConditions,reviewedGrowth} from "./formal-source";
import {masterCoverage,masterReviewReceipt,type MasterCoverage} from "./master-coverage";
import type {RadarInput,EvidenceRef,NumericComparison} from "./model";

/** Reads collector output from requests already made by the canonical provider. No fetch, no provider mutation. */
export function radarInputFromCompany(company:CompanyData,bundle:EvidenceBundle,latestDocuments:string[],evaluatedAt:string):RadarInput{
 const identity={companyId:company.identity.edinetCode??"",securityCode:company.identity.code,name:company.identity.name};
 const sources:EvidenceRef[]=bundle.documents.flatMap(d=>d.fragments.filter(f=>f.structure==="TEXT_ONLY"&&f.confidence==="CONFIRMED"&&!!f.text).map(f=>({
  ...identity,companyId:d.companyId,securityCode:d.securityCode,id:f.id,documentId:d.documentId,sourceType:d.sourceType,url:d.url,
  period:d.fiscalPeriod,filingDate:d.filingDate,retrievedAt:f.retrievedAt??d.retrievedAt,heading:f.heading,location:f.location,
  format:"TEXT" as const,primaryVerified:bundle.latestAnnual.verified,text:f.text!
 })));
 const conflicts:string[]=[];
 if(bundle.identity.companyId!==identity.companyId||bundle.identity.securityCode!==identity.securityCode||bundle.identity.symbol!==company.identity.symbol)conflicts.push("BUNDLE_COMPANY_CONFLICT");
 const comparisons:NumericComparison[]=[];
 const periods=[...company.annual].sort((a,b)=>b.end.localeCompare(a.end));
 const numericSource=(d:Datum):string|null=>{
  const doc=bundle.documents.find(v=>v.documentId===d.source.accession);
  if(!doc||d.value===null||!Number.isFinite(d.value)||!d.source.period||!d.source.field||d.source.provider!=="EDINET"||d.source.basis!=="annual")return null;
  const id=doc.documentId+"/numeric/"+d.source.field+"/"+d.source.period;
  if(!sources.some(s=>s.id===id))sources.push({...identity,id,companyId:doc.companyId,securityCode:doc.securityCode,documentId:doc.documentId,
   sourceType:"EDINET",url:doc.url,period:d.source.period,filingDate:doc.filingDate,retrievedAt:d.source.retrievedAt,
   heading:"連結財務諸表",location:d.source.field,format:"CANONICAL",primaryVerified:bundle.latestAnnual.verified,text:""});
  return id;
 };
 if(periods.length>=2)for(const [layer,key]of [["REVENUE","revenue"],["MARGIN_PROFIT","operatingIncome"],["OCF","operatingCF"]] as const){
  const current=periods[0][key],prior=periods[1][key],sourceRef=numericSource(current),priorSourceRef=numericSource(prior);
  if(sourceRef&&priorSourceRef)comparisons.push({layer,metric:key,current,prior,sourceRef,priorSourceRef});
 }
 return {identity,identityVerified:company.provider==="EDINET"&&bundle.latestAnnual.verified&&!conflicts.length,
  evaluationPeriod:bundle.latestAnnual.fiscalPeriod,latestDocumentIds:[...latestDocuments],evaluatedAt,sources,comparisons,conflicts};
}

/** Existing engines retain authority; Master is an inspected coverage receipt, not an invented 25-MET gate. */
export function deepResearchCompany(identity:UniverseIdentity,company:CompanyData,bundle:EvidenceBundle,latestAnnual:string|null,latestDocuments:string[],radar=radarInputFromCompany(company,bundle,latestDocuments,company.retrievedAt)):CandidateAudit&{masterCoverage?:MasterCoverage}{
 const audit=auditCompany(identity,company,latestAnnual,latestDocuments);
 if(audit.report){
  const researchEvidence=evaluateResearchEvidence(bundle),input=adaptCanonicalConditions(adaptEvidence(researchInput(company,"EMERGING"),researchEvidence),company,radar);
  audit.report={...audit.report,researchEvidence,researchStatus:evaluateResearchStatus(input),sections:{...audit.report.sections,growth:[...(audit.report.sections.growth??[]),...reviewedGrowth(radar).evidence]}};
  const coverage=masterCoverage(audit.report);
  audit.masterReview=masterReviewReceipt(audit.report,coverage);
  audit.remainingUnknowns=[...audit.report.researchStatus!.pendingReasons,...coverage.missingItems];
  return {...audit,masterCoverage:coverage};
 }
 return audit;
}
