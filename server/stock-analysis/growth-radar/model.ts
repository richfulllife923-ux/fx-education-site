import type {CompanyData,Datum} from "../model";
export const radarVersion="growth-radar/2026-10-01/owner-contract/1";
export type EconomicLayer="DEMAND"|"CUSTOMER"|"PRODUCT_SERVICE"|"CONTRACT_ORDER"|"CAPACITY"|"REVENUE"|"MARGIN_PROFIT"|"OCF"|"FCF"|"BALANCE_SHEET"|"PER_SHARE";
export type CandidateState="CHANGE_SIGNAL"|"VERIFYING"|"CANDIDATE"|"DEEP_RESEARCH"|"TOP3"|"PAUSED"|"INVALIDATED";
export type RelationType="CAUSES"|"DRIVES"|"CONTRIBUTES_TO"|"RESULTS_IN"|"ENABLES"|"LEADS_TO";
export type RadarIdentity={companyId:string;securityCode:string;name:string};
export type EvidenceRef=RadarIdentity&{
 id:string;documentId:string;sourceType:"EDINET";url:string;period:string;filingDate:string;retrievedAt:string;
 heading:string;location:string;format:"TEXT"|"TABLE"|"CANONICAL";primaryVerified:boolean;text:string;
};
export type ChangeFact={
 id:string;companyId:string;securityCode:string;layer:EconomicLayer;metric:string;direction:"INCREASE"|"DECREASE"|"START";
 currentPeriod:string;priorPeriod:string|null;sourceRef:string;priorSourceRef?:string;
 quote:string;span:{start:number;end:number}|null;currentValue:number|null;priorValue:number|null;
 classification:"MANAGEMENT_REPORTED_CHANGE"|"CANONICAL_CHANGE";confidence:"CONFIRMED";
};
export type ChangeRelation={
 id:string;triggerFactId:string;effectFactId:string;sourceRef:string;sourcePeriod:string;relationType:RelationType;
 provenance:"MANAGEMENT_ATTRIBUTED";classification:"MANAGEMENT_ATTRIBUTED_RELATION";
 quote:string;span:{start:number;end:number};binding:"SAME_SENTENCE"|"EXPLICIT_ADJACENT_REFERENCE";
};
export type WhyNow=Pick<ChangeRelation,"triggerFactId"|"effectFactId"|"sourceRef"|"sourcePeriod"|"relationType">&{relationId:string};
export type NumericComparison={layer:EconomicLayer;metric:string;current:Datum;prior:Datum;sourceRef:string;priorSourceRef:string};
export type RadarInput={
 identity:RadarIdentity;identityVerified:boolean;evaluationPeriod:string;latestDocumentIds:string[];evaluatedAt:string;
 sources:EvidenceRef[];comparisons?:NumericComparison[];conflicts?:string[];
};
export type GrowthRadarCompany={
 identity:RadarIdentity;state:CandidateState;structuralChange:"YES"|"UNVERIFIED";continuity:"UNVERIFIED";
 facts:ChangeFact[];relations:ChangeRelation[];whyNow:WhyNow[];remainingUnknowns:string[];lastEvaluatedAt:string;
 evidenceCoverage:{sourcesReviewed:number;changeFacts:number;explicitRelations:number;currentWhyNow:number};
 nextReviewTriggers:string[];ruleVersion:string;
};
/** Consumer input only; the existing financial provider and canonical company are never mutated. */
export type CompanyConsumer={company:CompanyData};
