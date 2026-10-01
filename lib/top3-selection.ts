import { analysisSections } from "./stock-analysis";
import type { Evidence, StockReport } from "./stock-analysis";
export const selectionVersion="S1-S7/2026-10-01/2";
export const selectionConstitutionSha="5b2de586ee4d484ccea84d6c6bf13cc103fe90192b72e87ecee8a9459be11eb8";
export const comparisonDimensions=["quality","inflection","coherence","cashConversion","risk","counterThesis","completeness","currentness"] as const;
export type ComparisonDimension=typeof comparisonDimensions[number];
export type UniverseIdentity={code:string;edinetCode:string;name:string;englishName:string;industry:string};
export type GrowthObservation={family:"REVENUE"|"PROFIT"|"CASH_FLOW";periods:string[];values:(number|null)[];growthRates:(number|null)[];evidence:Evidence[]};
/** Observations are measurements, not an attestation of growth quality or durability. */
export const masterCurrentSha="ec5375b0b817688b0299da8ebae2590e9ca766fb84f9173bb556f8245bb31ce9";
/** Master §39 has 25 review sections. UI section presence alone never certifies their review. */
export type MasterReview={masterSha:string;companySymbol:string;fiscalDate:string;
 sections:{number:number;reviewed:boolean;evidenceRefs:string[];remainingUnknowns:string[]}[];unresolvedMajorGaps:string[]};
export type CandidateAudit={masterReview?:MasterReview|null;identity:UniverseIdentity;report:StockReport|null;latestAnnual:string|null;latestDocuments:string[];
 parserValid:boolean;observations:GrowthObservation[];errors:string[];remainingUnknowns:string[]};
export type SelectionComparison={a:string;b:string;relation:"A_STRONGER"|"B_STRONGER"|"PARALLEL"|"UNDETERMINED";
 dimensions:Record<ComparisonDimension,{reason:string;evidenceRefs:string[]}>;reviewed:boolean};
export type Coverage={identityChecked:number;filingChecked:number;parserVerified:number;discoveryEvidenceChecked:number;masterReviewed:number;publicEligible:number;processed:number};
export type SelectionManifest={universeAsOf:string|null;filingCoverageThrough:string|null;runStartedAt:string;runCompletedAt:string|null;
 ruleVersion:string;parserVersion:string;snapshotId:string;freshnessProof?:{identityArchiveSha:string;dayListSha:string;day:string};candidateEvidenceRefs:string[];remainingUnknowns:string[];coverage:Coverage};
export type FeaturedCandidate={companyName:string;symbol:string;researchStatus:NonNullable<StockReport["researchStatus"]>;
 whyNow:Evidence[];keyNumbers:Evidence[];fiscalDate:string;remainingUnknowns:string[]};
export type FeaturedResult={status:"ready";state:"COMPLETE"|"IN_PROGRESS"|"RECHECK_REQUIRED"|"COMPARISON_REQUIRED";entries:FeaturedCandidate[];manifest:SelectionManifest;message:string};
export type SelectionRun={universe:UniverseIdentity[];audits:CandidateAudit[];comparisons:SelectionComparison[];manifest:SelectionManifest;complete:boolean;current:boolean};
const unique=(s:string[])=>[...new Set(s)].sort();
export function candidateBlockers(audit:CandidateAudit):string[]{
 const out:string[]=[],report=audit.report,status=report?.researchStatus;
 if(!report||!status)return ["ANALYSIS_UNAVAILABLE"];
 if(analysisSections.some(s=>!report.sections[s.id]?.length))out.push("MASTER_REPORT_INCOMPLETE");
 const review=audit.masterReview;
 if(!review||review.masterSha!==masterCurrentSha||review.companySymbol!==report.symbol||review.fiscalDate!==audit.latestAnnual||review.unresolvedMajorGaps.length||
 review.sections.length!==25||new Set(review.sections.map(s=>s.number)).size!==25||
 review.sections.some(s=>!Number.isInteger(s.number)||s.number<1||s.number>25||!s.reviewed||!s.evidenceRefs.length))out.push("MASTER_25_SECTION_REVIEW_UNVERIFIED");
 if(report.symbol!==audit.identity.code+".JP"||report.metadata?.provider!=="EDINET")out.push("IDENTITY_OR_PROVIDER_INVALID");
 if(!audit.latestAnnual||report.metadata?.fiscalDate!==audit.latestAnnual)out.push("LATEST_ANNUAL_UNVERIFIED");
 if(!audit.parserValid||audit.errors.length)out.push("PARSER_OR_DATA_GAP");
 if(status.status==="GRAY"||status.blockingReasons.length)out.push("GRAY_OR_BLOCKING");
 if(status.status==="GREEN"&&(status.dataCompleteness.valuation!=="AVAILABLE"||status.pendingReasons.length||status.ruleTrace.some(t=>t.result!=="PASS")))out.push("GREEN_STATUS_INCONSISTENT");
 if(status.status==="STAY"&&(!status.ruleTrace.some(t=>t.ruleId==="R4"&&t.result==="PENDING")||status.ruleTrace.some(t=>t.result==="PENDING"&&!["R4","R10"].includes(t.ruleId))))out.push("STAY_NOT_VALUATION_ONLY");
 for(const key of ["debt","operatingCF","freeCF"] as const)if(status.dataCompleteness[key]!=="AVAILABLE")out.push(key.toUpperCase()+"_UNAVAILABLE");
 // S4: do not infer 'valuation only pending' from the STAY label.
 const main=status.ruleTrace.filter(t=>t.ruleId!=="R4"&&t.ruleId!=="R9"&&t.ruleId!=="R10");
 if(main.filter(t=>t.ruleId==="R1/R2").length!==6||main.filter(t=>t.ruleId==="R7/R10").length!==2||main.filter(t=>t.ruleId==="R3/R10").length!==5||main.some(t=>t.result!=="PASS"))out.push("MAIN_CONDITIONS_PENDING");
 if(!status.ruleTrace.some(t=>t.ruleId==="R8"&&t.inputState==="MET"&&t.result==="PASS"&&t.evidenceRefs.length))out.push("GROWTH_REVIEW_UNVERIFIED");
 if(!status.ruleTrace.some(t=>t.ruleId==="R1/R2"&&t.reason.includes("この見方が崩れる条件")&&t.result==="PASS"&&t.evidenceRefs.length))out.push("COUNTER_THESIS_UNREVIEWED");
 // Every S1 family must retain comparable multi-period observations. No threshold turns them into approval.
 const families=new Set(audit.observations.filter(o=>o.periods.length>=3&&new Set(o.periods).size===o.periods.length&&
 o.values.every(v=>v!==null&&Number.isFinite(v))&&o.evidence.length>=3).map(o=>o.family));
 if(families.size<2)out.push("MULTI_FAMILY_MULTI_PERIOD_EVIDENCE_MISSING");
 const needed=["Revenue","Operating Income","Operating CF","Free Cash Flow","Equity"];
 const latest=Object.values(report.sections).flat().filter((e):e is Evidence=>!!e&&e.kind!=="UNKNOWN"&&!!e.period?.endsWith(audit.latestAnnual!));
 if(needed.some(label=>!latest.some(e=>e.label===label)))out.push("KEY_FINANCIAL_EVIDENCE_MISSING");
 return unique(out);
}
function featured(a:CandidateAudit):FeaturedCandidate{
 const r=a.report!,date=a.latestAnnual!,evidence=Object.values(r.sections).flat().filter((e):e is Evidence=>!!e);
 // R8-reviewed references are the only permitted source of Why Now. No theme/name templates.
 const refs=new Set(r.researchStatus!.ruleTrace.filter(t=>t.ruleId==="R8"&&t.result==="PASS").flatMap(t=>t.evidenceRefs));
 const whyNow=evidence.filter(e=>e.kind!=="UNKNOWN"&&(refs.has(e.field??"")||refs.has(e.sourceUrl+"#"+(e.field??"")))).slice(0,3);
 const keyNumbers=["Revenue","Operating Income","Operating CF","Free Cash Flow","Equity"].flatMap(label=>{
  const e=evidence.find(e=>e.label===label&&e.kind!=="UNKNOWN"&&e.period?.endsWith(date));return e?[e]:[];
 });
 return {companyName:r.companyName,symbol:r.symbol,researchStatus:r.researchStatus!,whyNow,keyNumbers,fiscalDate:date,remainingUnknowns:unique([...a.remainingUnknowns,...(a.masterReview?.sections.flatMap(s=>s.remainingUnknowns)??[])])};
}
export function selectFeatured(run:SelectionRun):FeaturedResult{
 const ids=new Set(run.universe.map(i=>i.edinetCode+"|"+i.code)),seen=new Set<string>();
 const audits=run.audits.filter(a=>{const id=a.identity.edinetCode+"|"+a.identity.code;if(!ids.has(id)||seen.has(id))return false;seen.add(id);return true;});
 audits.sort((a,b)=>a.identity.code.localeCompare(b.identity.code)||a.identity.edinetCode.localeCompare(b.identity.edinetCode));
 const duplicateInputs=new Set(run.audits.map(a=>a.identity.edinetCode+"|"+a.identity.code)).size!==run.audits.length||ids.size!==run.universe.length;
 const eligible=audits.filter(a=>!candidateBlockers(a).length).map(a=>featured(a)).filter(c=>c.whyNow.length>=2);
 const manifest={...run.manifest,candidateEvidenceRefs:[] as string[],remainingUnknowns:unique(run.manifest.remainingUnknowns),coverage:{...run.manifest.coverage,
 processed:audits.length,publicEligible:eligible.length,masterReviewed:eligible.length}};
 const response=(state:FeaturedResult["state"],entries:FeaturedCandidate[],message:string):FeaturedResult=>({status:"ready",state,entries,manifest:{...manifest,candidateEvidenceRefs:unique(entries.flatMap(e=>e.whyNow.map(v=>v.sourceUrl+"#"+(v.field??""))))},message});
 if(duplicateInputs)return response("RECHECK_REQUIRED",[],"企業照合・分析結果の重複を確認してください。");
 if(!run.current)return response("RECHECK_REQUIRED",[],"最新の開示とUniverseの再確認が必要です。過去の候補は継続表示しません。");
 if(!run.complete||audits.length!==ids.size)return response("IN_PROGRESS",[],"Universeの分析とEvidence確認を進めています。全体の選抜はまだ完了していません。");
 if(eligible.length<=3)return response("COMPLETE",eligible,eligible.length?"正式条件を満たす研究候補を並列表示しています。":"公開候補の成立を確認できていません。Evidenceが未確認の企業を補完表示しません。");
 // Comparisons require an explicit, source-backed review for ALL eight S3 dimensions.
 // No inferred ordering from rates, size, confidence labels or lexical ticker order.
 const eliminated=new Set<string>(),edges=new Map<string,string[]>();let unresolved=false;
 const stronger=(a:string,b:string)=>{eliminated.add(b);edges.set(a,[...(edges.get(a)??[]),b]);};
 for(let i=0;i<eligible.length;i++)for(let j=i+1;j<eligible.length;j++){
  const a=eligible[i].symbol,b=eligible[j].symbol;
  const matches=run.comparisons.filter(c=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a));
  const c=matches[0];
  if(matches.length!==1||!c?.reviewed||comparisonDimensions.some(d=>!c.dimensions[d]?.reason.trim()||!c.dimensions[d]?.evidenceRefs.length)||c.relation==="UNDETERMINED"){unresolved=true;continue;}
  if(c.relation==="A_STRONGER")stronger(c.a,c.b);if(c.relation==="B_STRONGER")stronger(c.b,c.a);
 }
 const visiting=new Set<string>(),visited=new Set<string>();
 const cycle=(node:string):boolean=>{if(visiting.has(node))return true;if(visited.has(node))return false;visiting.add(node);if((edges.get(node)??[]).some(cycle))return true;visiting.delete(node);visited.add(node);return false;};
 if(eligible.some(c=>cycle(c.symbol)))unresolved=true;
 const frontier=eligible.filter(c=>!eliminated.has(c.symbol));
 // A cycle or a tied frontier wider than three never becomes an arbitrary slice(0,3).
 if(unresolved||!frontier.length||frontier.length>3)return response("COMPARISON_REQUIRED",[],"候補間のEvidence比較が未確定です。順位や3社への絞り込みは補完しません。");
 return response("COMPLETE",frontier,"正式Evidenceによる比較を通過した研究候補を並列表示しています。");
}
