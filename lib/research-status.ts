/** Owner R1-R10 aggregation only. No financial thresholds, scores, or LLM decisions. */
export const constitutionVersion="R1-R10/2026-10-01";
export const constitutionSha="5cf99f28eb12d1f0f7c274f7799b62d17d28d79a83030f19c39971645a51b060";
export const researchAnalysisVersion="research-status/1";
export type Availability="AVAILABLE"|"MISSING"|"UNVERIFIED";
export type Condition={state:"MET"|"NOT_MET"|"UNVERIFIED";reason:string;evidenceRefs:string[]};
export type ConditionId="business"|"financials"|"cashFlow"|"balanceSheet"|"risk"|"counterThesis"|"valuation"|"growth";
export type ResearchStatusInput={
  provider:"READY"|"ERROR"|"UNVERIFIED";identity:"VERIFIED"|"UNRESOLVED"|"UNVERIFIED";
  latestAnnual:Availability;primaryEvidence:Availability;dataIntegrity:"VALID"|"MAJOR_ISSUE"|"UNVERIFIED";
  debt:Availability;operatingCF:Availability;freeCF:Availability;
  cashFlowMissingSeverity:"MAJOR"|"NOT_MAJOR"|"UNVERIFIED";
  majorRisk:"CLEAR"|"UNRESOLVED"|"UNVERIFIED";counterThesisMajorRisk:"CLEAR"|"UNRESOLVED"|"UNVERIFIED";
  valuation:Availability;growthMode:"STANDARD"|"EMERGING";
  conditions:Record<ConditionId,Condition>;sourceFiscalYear:string|null;
  existingResearchState?:string;ownerDecisionsRequired:string[];
};
export type ResearchStatusResult={
  status:"GREEN"|"STAY"|"GRAY";publicLabel:string;shortReason:string;
  passedReasons:string[];pendingReasons:string[];blockingReasons:string[];nextChecks:string[];
  sourceFiscalYear:string|null;analysisVersion:string;constitutionVersion:string;constitutionSha:string;
  existingResearchState?:string;ownerDecisionsRequired:string[];
  dataCompleteness:{debt:Availability;operatingCF:Availability;freeCF:Availability;valuation:Availability};
  ruleTrace:{ruleId:string;inputState:string;result:"PASS"|"PENDING"|"BLOCK";reason:string;evidenceRefs:string[]}[];
};
const labels:Record<ConditionId,string>={
 business:"事業理解",financials:"複数年財務",cashFlow:"CFの持続性",balanceSheet:"財務健全性",
 risk:"リスク確認",counterThesis:"この見方が崩れる条件",valuation:"現在価格との比較",growth:"成長変化",
};
const unique=(items:string[])=>[...new Set(items)];
export function evaluateResearchStatus(input:ResearchStatusInput):ResearchStatusResult {
 const passed:string[]=[],pending:string[]=[],blocking:string[]=[],next:string[]=[],blockedNext:string[]=[],owners=[...input.ownerDecisionsRequired];
 const trace:ResearchStatusResult["ruleTrace"]=[];
 const add=(ruleId:string,state:string,result:"PASS"|"PENDING"|"BLOCK",reason:string,check?:string,refs:string[]=[])=>{
  trace.push({ruleId,inputState:state,result,reason,evidenceRefs:[...refs]});
  (result==="PASS"?passed:result==="BLOCK"?blocking:pending).push(reason);
  if(check && result!=="PASS")(result==="BLOCK"?blockedNext:next).push(check);
 };
 const available=(rule:string,state:Availability,label:string,blockMissing=false)=>{
  add(rule,state,state==="AVAILABLE"?"PASS":state==="MISSING"&&blockMissing?"BLOCK":"PENDING",
   label+(state==="AVAILABLE"?"を取得しました。":state==="MISSING"?"が未取得です。":"の確認が未完了です。"),label+"を一次資料で確認");
 };
 // Priority: data/provider, major risk, debt/CF completeness, valuation, growth, remaining formal conditions.
 add("R3/R10",input.provider,input.provider==="ERROR"?"BLOCK":input.provider==="READY"?"PASS":"PENDING",
  input.provider==="ERROR"?"一次資料データの取得に問題があります。":input.provider==="READY"?"一次資料データを取得しました。":"一次資料の取得状況が未確認です。","一次資料の接続と取得状況を確認");
 add("R3/R10",input.identity,input.identity==="UNRESOLVED"?"BLOCK":input.identity==="VERIFIED"?"PASS":"PENDING",
  input.identity==="UNRESOLVED"?"企業を特定できません。":input.identity==="VERIFIED"?"企業と証券コードを照合しました。":"企業の照合が未完了です。","企業名と証券コードを照合");
 available("R3/R10",input.latestAnnual,"最新正式年度",true);
 available("R3/R10",input.primaryEvidence,"主要一次資料",true);
 add("R3/R10",input.dataIntegrity,input.dataIntegrity==="MAJOR_ISSUE"?"BLOCK":input.dataIntegrity==="VALID"?"PASS":"PENDING",
  input.dataIntegrity==="MAJOR_ISSUE"?"一次資料の整合性に重大な問題があります。":input.dataIntegrity==="VALID"?"対象期間・通貨・基準の整合性を確認しました。":"データ整合性の確認が未完了です。","期間・通貨・単位と資料の整合性を確認");
 for(const [state,label]of [[input.majorRisk,"重大リスク"],[input.counterThesisMajorRisk,"反対仮説の重大リスク"]] as const){
  add("R7/R10",state,state==="UNRESOLVED"?"BLOCK":state==="CLEAR"?"PASS":"PENDING",
   label+(state==="UNRESOLVED"?"が未解決です。":state==="CLEAR"?"の確認が完了しています。":"の確認が未完了です。"),label+"と解決状況を一次資料で確認");
 }
 available("R6",input.debt,"有利子負債",true);
 for(const [state,label]of [[input.operatingCF,"営業CF"],[input.freeCF,"FCF"]] as const){
  available("R5",state,label,input.cashFlowMissingSeverity==="MAJOR");
  if(state!=="AVAILABLE" && input.cashFlowMissingSeverity==="UNVERIFIED")owners.push("R5：CF欠損の重大性の判定条件");
 }
 available("R4",input.valuation,"現在価格との比較");
 const checkCondition=(id:ConditionId,rule:string)=>{
  const item=input.conditions[id];
  const met=item.state==="MET"&&item.evidenceRefs.length>0&&!!item.reason.trim();
  add(rule,item.state,met?"PASS":"PENDING",labels[id]+(met?"の研究条件が成立しています。":item.state==="NOT_MET"?"の研究条件が未成立です。":"の研究条件は未確認です。"),
   labels[id]+"の成立条件と根拠を確認",item.evidenceRefs);
  if(item.state==="UNVERIFIED" || item.state==="MET"&&!met)owners.push(labels[id]+"：正式な合否条件または根拠の確定");
 };
 checkCondition("valuation","R4");
 if(input.growthMode==="EMERGING")checkCondition("growth","R8");
 else trace.push({ruleId:"R8",inputState:"STANDARD",result:"PASS",reason:"通常企業ではGrowthを一律必須条件にしません。",evidenceRefs:[]});
 for(const id of ["business","financials","cashFlow","balanceSheet","risk","counterThesis"] as const)checkCondition(id,"R1/R2");
 if(input.majorRisk==="UNVERIFIED"||input.counterThesisMajorRisk==="UNVERIFIED")owners.push("R7：重大Riskと反証の重大性・解決の判定条件");
 const status=blocking.length?"GRAY":pending.length?"STAY":"GREEN";
 trace.push({ruleId:"R9",inputState:input.existingResearchState??"UNVERIFIED",result:"PASS",reason:"既存Research Stateを保持し、色への自動対応は行いません。",evidenceRefs:[]});
 trace.push({ruleId:"R10",inputState:status,result:status==="GRAY"?"BLOCK":status==="STAY"?"PENDING":"PASS",reason:"正式優先順位で集約しました。",evidenceRefs:[]});
 return {status,publicLabel:status==="GREEN"?"買い検討条件：成立":status==="STAY"?"STAY":"判定保留",
  shortReason:blocking[0]??pending[0]??"TUTTOの主要研究条件が成立しています。",
  passedReasons:unique(passed),pendingReasons:unique(pending),blockingReasons:unique(blocking),nextChecks:unique([...blockedNext,...next]),
  sourceFiscalYear:input.sourceFiscalYear,analysisVersion:researchAnalysisVersion,constitutionVersion,constitutionSha,
  existingResearchState:input.existingResearchState,ownerDecisionsRequired:unique(owners),
  dataCompleteness:{debt:input.debt,operatingCF:input.operatingCF,freeCF:input.freeCF,valuation:input.valuation},ruleTrace:trace};
}

/** Client transport failures use the same R3 summary, with no fabricated financial report. */
export function unavailableResearchStatus():ResearchStatusResult {
 const item=():Condition=>({state:"UNVERIFIED",reason:"一次資料の取得が必要です。",evidenceRefs:[]});
 return evaluateResearchStatus({
  provider:"ERROR",identity:"UNRESOLVED",latestAnnual:"MISSING",primaryEvidence:"MISSING",dataIntegrity:"UNVERIFIED",
  debt:"UNVERIFIED",operatingCF:"UNVERIFIED",freeCF:"UNVERIFIED",cashFlowMissingSeverity:"UNVERIFIED",
  majorRisk:"UNVERIFIED",counterThesisMajorRisk:"UNVERIFIED",valuation:"UNVERIFIED",growthMode:"STANDARD",
  conditions:{business:item(),financials:item(),cashFlow:item(),balanceSheet:item(),risk:item(),counterThesis:item(),valuation:item(),growth:item()},
  sourceFiscalYear:null,ownerDecisionsRequired:[],
 });
}