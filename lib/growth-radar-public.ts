import type {FeaturedCandidate,FeaturedResult} from "./top3-selection";
import type {SummaryScoreResult} from "./summary-score";

/** Public projection only. Never exposes raw research runs or accepts reviews from a browser. */
export type GrowthFeaturedCandidate=Omit<FeaturedCandidate,'researchStatus'|'remainingUnknowns'>&{
  researchStatus:Pick<FeaturedCandidate['researchStatus'],'status'|'publicLabel'|'shortReason'|'sourceFiscalYear'>;
  whatIsChanging:string[];
  radarWhyNow:{quote:string;sourceUrl:string;period:string;provenance:"MANAGEMENT_ATTRIBUTED"}[];
  summaryScore:Pick<SummaryScoreResult,'score'|'coverage'|'display'>;
  majorRisks:string[];
  nextConfirmation:string[];
  updatedAt:string;
};
export type GrowthFeaturedResult=Omit<FeaturedResult,"entries"|'manifest'>&{
  manifest:Pick<FeaturedResult['manifest'],'universeAsOf'|'filingCoverageThrough'|'runStartedAt'|'runCompletedAt'|'coverage'>;
  generatedAt:string|null;
  candidateCount:number;
  selectedCount:number;
  selected:GrowthFeaturedCandidate[];
  entries:GrowthFeaturedCandidate[];
  uiState:"READY"|"NO_QUALIFIED_CANDIDATES"|"VERIFYING";
};
