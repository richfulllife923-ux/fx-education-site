import {evaluateResearchStatus,type ResearchStatusInput} from "../../../lib/research-status";
import {researchInput} from "../research-status";
import type {CompanyData} from "../model";
import type {EvidenceDecision,ResearchEvidenceResult,EvidenceBundle} from "./model";
import {evaluateResearchEvidence} from "./evaluators";
export function adaptEvidence(input:ResearchStatusInput,result:Pick<ResearchEvidenceResult,"business"|"cashFlowSustainability"|"majorRisk"|"counterThesis">):ResearchStatusInput{
 const condition=(d:EvidenceDecision,allowMinor=false)=>({state:(d.status==="PARTIAL"?(allowMinor?"MET":"UNVERIFIED"):d.status) as "MET"|"NOT_MET"|"UNVERIFIED",reason:d.reason,evidenceRefs:[...d.evidenceRefs]});
 // PARTIAL is only R11's permitted minor detail gap; the complete major-business chain passed.
 const risk=(d:EvidenceDecision)=>d.status==="MET"?"CLEAR" as const:d.status==="NOT_MET"?"UNRESOLVED" as const:"UNVERIFIED" as const;
 return {...input,conditions:{...input.conditions,business:condition(result.business,true),cashFlow:condition(result.cashFlowSustainability),risk:condition(result.majorRisk),counterThesis:condition(result.counterThesis)},
 majorRisk:risk(result.majorRisk),counterThesisMajorRisk:risk(result.counterThesis)};
}
export function researchWithEvidence(company:CompanyData,bundle:EvidenceBundle,growthMode:"STANDARD"|"EMERGING"="STANDARD"){
 const researchEvidence=evaluateResearchEvidence(bundle);
 return {researchStatus:evaluateResearchStatus(adaptEvidence(researchInput(company,growthMode),researchEvidence)),researchEvidence};
}

