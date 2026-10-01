/** Owner D1-D3 trace; this is data provenance, not an investment condition. */
export type DebtSourceType = "SOURCE_DECLARED_TOTAL" | "CALCULATED_FROM_COMPONENTS" | "UNVERIFIED" | "UNAVAILABLE";
export type DebtScope = "CONSOLIDATED" | "FINANCIAL_BUSINESS" | "NON_FINANCIAL_BUSINESS";
export type DebtComponent = {
  name:string; value:number|null; fiscalDate:string; currency:string|null;
  sourceField:string; contextRef:string; sourceUrl:string;
};
export type DebtEvidence = {
  sourceType:DebtSourceType; sourceField:string; fiscalDate:string; currency:string|null;
  scope:DebtScope; confidence:"CONFIRMED"|"UNVERIFIED";
  components:DebtComponent[];
  checks:{id:string;passed:boolean;detail:string;sourceField?:string}[];
  doubleCount:"NO"|"UNVERIFIED"; validationFormula?:string; validationValue?:number|null;
  supplemental:{label:string;scope:DebtScope;role:"SUPPLEMENTAL";current:DebtComponent;noncurrent:DebtComponent}[];
};