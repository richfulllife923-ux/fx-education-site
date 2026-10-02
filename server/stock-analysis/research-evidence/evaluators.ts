import {normalizeFacts,currentFacts,ofKind,strings,type EvidenceBundle,type NormalizedEvidence,type Relation,type EvidenceDecision,type ResearchEvidenceResult} from "./model";
import {buildBusinessRelations,buildCashRelations,buildRiskRelations,buildCounterRelations} from "./relations";
import {evidenceRuleVersion} from "./model";
function decision(rule:string,n:NormalizedEvidence,relations:Relation[],status:EvidenceDecision["status"],reason:string,missingItems:string[]=[]):EvidenceDecision{
 const refs=[...new Set(relations.flatMap(r=>r.factRefs))];
 return {status,reason,evidenceRefs:refs,missingItems,confidence:status==="UNVERIFIED"?"UNVERIFIED":status==="NOT_MET"?"CONTRADICTED":"SUPPORTED",
 predicateTrace:[{predicate:rule,outcome:status==="UNVERIFIED"?"UNVERIFIED":status==="NOT_MET"?"FAIL":"PASS",reason,
 factRefs:refs,relationRefs:relations.map(r=>r.id)}]};
}
export function evaluateBusinessUnderstanding(bundle:EvidenceBundle):EvidenceDecision{
 const n=normalizeFacts(bundle),relations=buildBusinessRelations(n),facts=currentFacts(n);
 if(relations.some(r=>r.fields.failure))return decision("R11/major-business-continuity",n,relations,"NOT_MET","主要事業の構造に対する重大な不成立Evidenceがあります。");
 const chains=relations.filter(r=>r.fields.complete);
 if(!chains.length||chains.length!==chains[0].fields.scopeSize)return decision("R11/product-customer-revenue-profit",n,relations,"UNVERIFIED",
 "主要事業の製品・顧客・収益源・利益構造を結ぶ正式な構造化Evidenceが不足しています。",
 ["主要事業の完全なscope","ProductOrService → CustomerOrMarket → RevenueSource → ProfitDriver",...n.rejected]);
 const minor=ofKind(facts,"MinorDetailGap").flatMap(f=>strings(f.fields.items));
 return decision("R11/product-customer-revenue-profit",n,relations,minor.length?"PARTIAL":"MET",
 minor.length?"主要事業の利益構造は確認でき、補助的な詳細が未確認です。":"主要事業の利益構造が一次Factと明示的Relationで確認できました。",minor);
}
function trend(values:number[]):string{
 const signs=values.slice(1).map((v,i)=>Math.sign(v-values[i]));
 return signs.every(v=>v===0)?"FLAT":signs.every(v=>v>=0)?"UP":signs.every(v=>v<=0)?"DOWN":"MIXED";
}
export function evaluateCashFlowSustainability(bundle:EvidenceBundle):EvidenceDecision{
 const n=normalizeFacts(bundle),relations=buildCashRelations(n),periods=relations.filter(r=>r.fields.period),explanation=relations.find(r=>r.id==="R12/explanation");
 const finish=(state:EvidenceDecision["status"],reason:string,missing:string[]=[])=>({...decision("R12/multi-period-cash-conversion-and-one-off",n,relations,state,reason,missing),
 periodsReviewed:periods.map(r=>String(r.fields.period)),ocfTrend:periods.length?trend(periods.map(r=>Number(r.fields.ocf))):"UNVERIFIED",
 fcfTrend:periods.length?trend(periods.map(r=>Number(r.fields.fcf))):"UNVERIFIED"});
 if(periods.length<3||!explanation)return finish("UNVERIFIED","比較可能な複数期の数値と、Cash Conversion・単発要因の正式Relationが揃っていません。",
 [...(periods.length<3?["最低3年の比較可能なNet Income / OCF / CapEx / 既存FCF"]:[]),...(explanation?[]:["CashFlowExplanation","OneOffFact"]),...n.rejected]);
 const x=explanation.fields;
 if(!["CONTINUING","PERSISTENT_FAILURE"].includes(String(x.cashConversion))||
 !["NONE","TEMPORARY","PERSISTENT"].includes(String(x.deterioration))||
 !["NOT_SOLE_DRIVER","SOLE_DRIVER"].includes(String(x.oneOff)))
 return finish("UNVERIFIED","Cash Conversionまたは一時要因・継続要因の区別が未確認です。",["Cash conversion / one-off / deteriorationの正式確認"]);
 if(x.cashConversion==="PERSISTENT_FAILURE"||(x.deterioration==="PERSISTENT"&&x.oneOff==="NOT_SOLE_DRIVER"))
 return finish("NOT_MET","複数期間のCash Conversion喪失または一時要因では説明できない継続的悪化の正式Evidenceがあります。");
 if(x.oneOff==="SOLE_DRIVER")return finish("UNVERIFIED","単発要因以外の持続性を証明できません。",["単発要因だけではないCash Conversion"]);
 return finish("MET","複数期の利益・OCF・既存FCFと、Cash Conversion・一時要因の関係が一次Evidenceで確認できました。");
}
export function evaluateMajorRisk(bundle:EvidenceBundle):EvidenceDecision{
 const n=normalizeFacts(bundle),relations=buildRiskRelations(n);
 const finish=(state:EvidenceDecision["status"],reason:string,missing:string[]=[])=>({...decision("R13/current-impact-response-resolution",n,relations,state,reason,missing),
 identifiedRisks:relations.map(r=>String(r.fields.category)),
 blockingRisks:relations.filter(r=>r.fields.materiality==="MAJOR"&&r.fields.state==="ACTIVE"&&r.fields.impact==="MATERIAL"&&(r.fields.response==="NONE"||r.fields.effect==="INSUFFICIENT")).map(r=>String(r.fields.riskId)),
 mitigations:relations.filter(r=>r.fields.effect==="EFFECTIVE"||r.fields.state==="RESOLVED").map(r=>String(r.fields.riskId))});
 if(!relations.length||relations.length!==relations[0].fields.scopeSize)return finish("UNVERIFIED","主要Riskの完全なscopeまたは会社固有の構造化Evidenceが不足しています。",
 ["RiskScope / RiskFact / materiality basis / current impact / response",...n.rejected]);
 if(relations.some(r=>r.fields.response==="NONE"&&r.fields.effect==="EFFECTIVE"))return finish("UNVERIFIED","同一Riskの未対応と有効な対応Evidenceが競合しています。",["競合Evidenceの正式な解決"]);
 if(relations.some(r=>r.fields.resolutionInvalid))return finish("UNVERIFIED","Risk終了Evidenceの後続時点・同一論点の対応を確認できません。",["後続一次資料による解決確認"]);
 if(relations.some(r=>r.fields.materiality==="MAJOR"&&r.fields.state==="ACTIVE"&&r.fields.impact==="MATERIAL"&&(r.fields.response==="NONE"||r.fields.effect==="INSUFFICIENT")))
 return finish("NOT_MET","現在ACTIVEな重大Riskについて、顕在影響と未対応または対応不十分が一次Evidenceで確認されました。");
 const proven=relations.every(r=>r.fields.state==="RESOLVED"||
  (r.fields.state==="MITIGATED"&&["MATERIAL","NON_MATERIAL"].includes(String(r.fields.impact))&&r.fields.response==="IMPLEMENTED"&&r.fields.effect==="EFFECTIVE"));
 if(!proven)return finish("UNVERIFIED","Riskの現在影響・対応の実効性・未解決性を証明できません。",["現在影響 / mitigation effectiveness / resolution"]);
 return finish("MET","主要Riskの現在状態と有効な対応または後続一次資料による解決が確認できました。");
}
export function evaluateCounterThesis(bundle:EvidenceBundle):EvidenceDecision{
 const n=normalizeFacts(bundle),relations=buildCounterRelations(n),facts=currentFacts(n);
 const finish=(state:EvidenceDecision["status"],reason:string,missing:string[]=[])=>({...decision("R14/company-specific-primary-counter-relation",n,relations,state,reason,missing),
 primaryThesis:relations.map(r=>String(r.fields.primary)),counterTheses:relations.map(r=>String(r.fields.counter)),
 supportingEvidence:relations.filter(r=>["NOT_MATERIALIZED","RESOLVED"].includes(String(r.fields.state))).flatMap(r=>r.factRefs),
 conflictingEvidence:relations.filter(r=>r.fields.state==="ACTIVE").flatMap(r=>r.factRefs)});
 if(!relations.length||new Set(relations.map(r=>r.fields.counterId)).size!==ofKind(facts,"CounterThesisFact").length||
 new Set(relations.map(r=>r.fields.primaryId)).size!==ofKind(facts,"PrimaryThesisFact").length)
 return finish("UNVERIFIED","企業固有の主仮説と反対仮説を結ぶ正式な一次Evidence・Relationが不足しています。",
 ["PrimaryThesisFact ↔ CounterThesisFact / CurrentState / MaterialityBasis",...n.rejected]);
 if(relations.some(r=>r.fields.materiality==="MAJOR"&&r.fields.state==="ACTIVE"&&r.fields.coreImpact==="DESTROYS"))
 return finish("NOT_MET","現在成立する重大反証が主仮説の中心因果を破壊することが一次Evidenceで確認されました。");
 if(!relations.every(r=>["NOT_MATERIALIZED","RESOLVED"].includes(String(r.fields.state))&&["NONE","WEAKENS"].includes(String(r.fields.coreImpact))))
 return finish("UNVERIFIED","反証の現在状態または中心因果への影響を確定できません。",["current counter evidence / causal impact"]);
 return finish("MET","企業固有の主仮説・主要反証・現在状態を一次FactとRelationで確認しました。");
}
export function evaluateResearchEvidence(bundle:EvidenceBundle):ResearchEvidenceResult{
 const n=normalizeFacts(bundle),business=evaluateBusinessUnderstanding(bundle),cashFlowSustainability=evaluateCashFlowSustainability(bundle),
 majorRisk=evaluateMajorRisk(bundle),counterThesis=evaluateCounterThesis(bundle);
 const yes=(r:EvidenceDecision)=>r.status==="MET"||r.status==="PARTIAL";
 return {ruleVersion:evidenceRuleVersion,fiscalDate:bundle.latestAnnual.fiscalPeriod||null,business,cashFlowSustainability,majorRisk,counterThesis,
 coverage:{business:yes(business),cashFlow:yes(cashFlowSustainability),risk:yes(majorRisk),counterThesis:yes(counterThesis)},
 sourceCandidates:bundle.documents.reduce((total,d)=>total+d.fragments.filter(f=>f.structure==="TEXT_ONLY").length,0),structuredFacts:n.facts.length,
 relations:[...buildBusinessRelations(n),...buildCashRelations(n),...buildRiskRelations(n),...buildCounterRelations(n)].length,
 provenance:Object.fromEntries(n.facts.map(f=>[f.id,f.metadata])),extractionIssues:n.rejected};
}

