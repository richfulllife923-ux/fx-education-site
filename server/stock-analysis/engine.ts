import type { Evidence, StockReport, SectionId } from "../../lib/stock-analysis";
import type { CompanyData, Datum } from "./model";
import { freeCashFlow, growth, margin, netCash, ratio, type Calculation } from "./calculations";
export function display(value:number|null,unit=""):string {
  return value===null?"未取得":new Intl.NumberFormat("ja-JP",{maximumFractionDigits:2}).format(value)+(unit?" "+unit:"");
}
function observed(label:string,datum:Datum):Evidence {
  const s=datum.source;
  return {label,value:display(datum.value,s.unit==="currency"?s.currency??"通貨未確認":s.unit),kind:datum.value===null?"UNKNOWN":s.classification??"SOURCE CLAIM",
    sourceUrl:s.url,sourceTitle:s.title,asOf:s.asOf??"提供元更新日未取得",
    period:s.basis+" / "+(s.start?s.start+" → ":"")+(s.period??"基準日未確認"),currency:s.currency??undefined,unit:s.unit,
    retrievedAt:s.retrievedAt,field:s.field,confidence:datum.value===null?"UNVERIFIED":s.classification==="FACT"?"CONFIRMED":"SUPPORTED",
    filingDate:s.filingDate??undefined};
}
function calculated(label:string,calc:Calculation):Evidence {
  const item=observed(label,{value:calc.value,source:calc.source});
  return {...item,kind:calc.value===null?"UNKNOWN":"CALCULATION",
    value:calc.value===null?"算定保留："+calc.reason:display(calc.value,calc.source.unit==="currency"?calc.source.currency??"":calc.source.unit),
    formula:calc.formula,inputs:calc.inputs.map(input=>({
      name:input.name,value:input.datum.value,period:input.datum.source.period,
      basis:input.datum.source.basis,currency:input.datum.source.currency,field:input.datum.source.field,
      asOf:input.datum.source.asOf,sourceUrl:input.datum.source.url,
    }))};
}
export function buildReport(company:CompanyData,now=new Date().toISOString()):StockReport {
  const latest=company.annual[0],previous=company.annual[1],prior=company.annual[2];
  const sections:Partial<Record<SectionId,Evidence[]>>={};
  const add=(id:SectionId,...items:Evidence[])=>{(sections[id]??=[]).push(...items);};
  const free=company.mode==="FREE";
  const sourceUrl=company.primarySource?.url??"https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds";
  const identityKind:Evidence["kind"]=company.primarySource?.classification??"SOURCE CLAIM";
  const explanation=(label:string,value:string,kind:Evidence["kind"]="INFERENCE",related:Evidence[]=[]):Evidence=>({
    label,value,kind,sourceUrl:related[0]?.sourceUrl??sourceUrl,
    sourceTitle:related.length?"参照データと確認条件":kind==="FACT"?company.primarySource?.title??"公式提出資料":"TUTTO条件付き研究テンプレート（追加の一次資料確認が必要）",
    asOf:company.updatedAt??"提供元更新日未取得",period:latest?"annual / "+latest.end:undefined,
    retrievedAt:company.retrievedAt,field:kind==="FACT"?company.primarySource?.field:undefined,confidence:kind==="FACT"?"CONFIRMED":kind==="SOURCE CLAIM"?"SUPPORTED":"UNVERIFIED",
    relatedFields:related.flatMap(item=>item.field?[item.field]:item.inputs?.map(input=>input.field)??[]),
  });
  add("company",explanation("Company Name",company.identity.name,identityKind),
    explanation("Ticker / Code",company.identity.symbol,identityKind),
    explanation("Market",company.identity.exchange==="JP"?"日本 / EDINET証券コード（取引所は未確認）":company.identity.exchange+" / "+company.identity.country,identityKind),
    explanation("Sector",company.sector??"未取得",company.sector?identityKind:"UNKNOWN"),
    explanation("Industry",company.industry??"未取得",company.industry?identityKind:"UNKNOWN"));
  if (company.quote) add("company",observed("株価（indicative / delayed・取引判断には使用しない）",company.quote.price));
  add("business",explanation(free?"事業説明（提出書類の本文確認が必要）":"提供元の事業説明",company.description??"事業説明は未取得です。企業IRの製品・顧客・販売モデルを確認してください。",company.description?"SOURCE CLAIM":"UNKNOWN"),
    explanation("初心者向け確認",company.industry?company.industry+"に分類された企業です。具体的な製品、購入する顧客、販売・継続課金の仕組みを企業IRで確認します。":"企業IRから製品・顧客・収益モデルの確認が必要です。","UNKNOWN"));
  add("revenue",explanation("収益構造", "セグメント別売上、顧客・地域別構成、価格と販売数量の寄与はこのフィードから確認できていません。総売上だけで事業別の成長を断定しません。","UNKNOWN"));
  const metrics=latest?{
    operatingMargin:calculated("営業利益率",margin(latest.operatingIncome,latest.revenue)),
    grossMargin:calculated("粗利益率",margin(latest.grossProfit,latest.revenue)),
    netMargin:calculated("純利益率",margin(latest.netIncome,latest.revenue)),
    fcf:calculated("Free Cash Flow",freeCashFlow(latest)),
    netCash:calculated("現金 − 有利子負債（投資資産は含めない）",netCash(latest)),
    cfConversion:calculated("営業CF / 純利益",ratio(latest.operatingCF,latest.netIncome,"operatingCF / netIncome")),
  }:null;
  for (const period of company.annual) {
    add("performance",observed("Revenue",period.revenue),observed("Operating Income",period.operatingIncome),observed("Net Income",period.netIncome),...(period.eps?[observed("EPS（開示された基本/希薄化後・年次）",period.eps)]:[]));
    add("cash-flow",observed("Operating CF",period.operatingCF),observed("Investing CF",period.investingCF),
      observed("Financing CF",period.financingCF),observed("CapEx（支出）",period.capex),calculated("Free Cash Flow",freeCashFlow(period)));
  }
  if (metrics && latest) {
    add("performance",metrics.grossMargin,metrics.operatingMargin,metrics.netMargin);
    add("cash-flow",metrics.cfConversion,explanation("FCFの限界","Total CapExを控除したFCFです。維持投資と成長投資は分離できていません。持続的な分配可能利益とは断定しません。","UNKNOWN",[metrics.fcf]));
    add("finance",observed("Cash",latest.cash),observed("Debt",latest.debt),observed("Equity",latest.equity),observed("Total Assets",latest.assets),...(latest.liabilities?[observed("Total Liabilities",latest.liabilities)]:[]),
      ...(latest.currentDebt?[observed("Current Debt（全有利子負債の代用にはしない）",latest.currentDebt)]:[]),
      ...(latest.noncurrentDebt?[observed("Noncurrent Debt（全有利子負債の代用にはしない）",latest.noncurrentDebt)]:[]),metrics.netCash);
  } else {
    ["performance","cash-flow","finance"].forEach(id=>add(id as SectionId,explanation("財務データ","対応する財務データが未取得です。企業開示で確認してください。","UNKNOWN")));
  }
  // Quarterly values stay in their own basis; no synthetic TTM or annualized partial year.
  const half=company.semiAnnual?.[0];
  if(half)add("performance",observed("直近半期 Revenue（年次・四半期とは別期間）",half.revenue),observed("直近半期 Operating Income",half.operatingIncome));
  const quarter=company.quarterly[0];
  if (quarter) add("performance",observed("直近四半期 Revenue（年次とは別期間）",quarter.revenue),
    observed("直近四半期 Operating Income",quarter.operatingIncome));
  const revGrowth=latest&&previous?calculated("Revenue YoY",growth(latest.revenue,previous.revenue)):null;
  const profitGrowth=latest&&previous?calculated("Net Income YoY",growth(latest.netIncome,previous.netIncome)):null;
  if (revGrowth && profitGrowth) add("growth",revGrowth,profitGrowth);
  add("growth",explanation("構造成長の確認","需要増が売上・利益率・営業CFへ転換しているかを継続確認します。年次の成長だけでは構造要因と市況循環を区別できません。","UNKNOWN"));
  if(free)add("valuation",explanation("VALUATION_STATUS = LIMITED","財務分析は利用可能、市場価格ベース指標は未接続です。P/E・P/B・EV/EBITDA・FCF Yieldは算定保留です。","UNKNOWN"));
  else add("valuation",observed("P/E（提供元TTM・入力値/基準日の完全照合は未実施）",company.valuation.pe),
    observed("P/B（提供元MRQ・基準日の完全照合は未実施）",company.valuation.pb),
    observed("EV/EBITDA（提供元TTM）",company.valuation.evEbitda),
    observed("Price / Sales（提供元TTM）",company.valuation.ps),
    observed("Market Capitalization（通貨・株数基準日未確認、計算には使用しない）",company.valuation.marketCap),
    observed("Enterprise Value（提供元値・構成と時点は要照合）",company.valuation.enterpriseValue),
    observed("EBITDA（提供元TTM・通貨基準未確認）",company.valuation.ebitdaTTM),
    explanation("FCF Yield","時価総額の通貨・価格日・株数基準日と同期間のFCFが照合できていないため算定保留です。","UNKNOWN"),
    explanation("Valuationの解釈","倍率だけで割安・割高を決めません。期間、会計基準、分割調整、成長・利益の持続性を一次資料で確認します。","UNKNOWN"));
  const sector=[company.sector,company.industry].filter(Boolean).join(" ").toLowerCase();
  const semiconductor=/semiconductor|キオクシア/i.test(sector+" "+company.identity.name),memory=semiconductor && /memory|kioxia|キオクシア/i.test(company.identity.name+" "+sector);
  const financial=/bank|financial services|insurance|銀行|保険/.test(sector),auto=/auto|automobile|輸送用機器/.test(sector);
  const riskEvidence:Evidence[]=[];
  if (latest?.netIncome.value!==null && latest && latest.netIncome.value!<0)
    riskEvidence.push(explanation("赤字の継続リスク","直近年次の純利益が負です。資金繰りと黒字化条件を確認します。","INFERENCE",[observed("Net Income",latest.netIncome)]));
  if (latest && freeCashFlow(latest).value!==null && freeCashFlow(latest).value!<0)
    riskEvidence.push(explanation("投資・資金需要","直近FCFが負です。成長投資、運転資本、営業CF不足のどれが原因かを確認します。","INFERENCE",[metrics!.fcf]));
  if (latest && previous) {
    const inventoryGrowth=growth(latest.inventory,previous.inventory),salesGrowth=growth(latest.revenue,previous.revenue);
    const receivablesGrowth=growth(latest.receivables,previous.receivables);
    if (inventoryGrowth.value!==null && salesGrowth.value!==null && inventoryGrowth.value>salesGrowth.value)
      riskEvidence.push(explanation("在庫の増加","在庫の増加率が売上増加率を上回っています。需要・評価損・製品入替の一次資料を確認します。","INFERENCE",[calculated("Inventory YoY",inventoryGrowth),revGrowth!]));
    if (receivablesGrowth.value!==null && salesGrowth.value!==null && receivablesGrowth.value>salesGrowth.value)
      riskEvidence.push(explanation("売掛金の増加","売掛金の増加率が売上増加率を上回っています。回収期間・取引条件の変化を確認します。","INFERENCE",[calculated("Receivables YoY",receivablesGrowth),revGrowth!]));
  }
  if (riskEvidence.length) add("risk",...riskEvidence);
  add("risk",explanation("未確認リスク","顧客集中、競争、規制、技術変化、債務返済期限はこのフィードだけでは確認できません。未確認を低リスクとは扱いません。","UNKNOWN"));
  if(financial)add("cash-flow",explanation("金融業での適用制限","通常事業のFCFを金融業の分配可能利益として使用しません。規制資本・信用コスト・資金調達構造は追加確認が必要です。","UNKNOWN"));
  if (financial || auto) add("risk",explanation("業種別の財務確認",financial?
    "金融業は通常事業のFCF・Debt比較が適切でない場合があります。資本充足、信用コスト、調達構造を別途確認します。":
    "自動車関連では金融事業と製造事業の負債を分離する必要があります。連結Debtだけで財務健全性を断定しません。","UNKNOWN"));
  if (semiconductor) add("risk",explanation("半導体の循環条件",memory?
    "メモリー価格・供給増・設備投資を確認します。現在の利益や低いP/Eを中期の正常利益と同一視しません。":
    "顧客投資、供給制約、輸出規制、技術更新の条件を確認します。テーマへの所属だけで恩恵を断定しません。","UNKNOWN"));
  add("risk",explanation("Counter-Thesis（必須）","成長が販売価格・一時需要に依存している、利益が現金化していない、競争で利益率が低下する可能性を反証として検証します。セグメント、顧客、在庫・売掛金、継続する営業CFが確認できるまで成長仮説は暫定です。","INFERENCE",[...(revGrowth?[revGrowth]:[]),...(metrics?[metrics.fcf,metrics.operatingMargin]:[])]));
  const baseline=latest?"基準："+latest.end+" annual / "+(latest.currency??"通貨不明")+"。":"基準となる年次財務は未取得。";
  add("scenarios",
    explanation("Bull：成立条件 / 無効化",baseline+"売上増が利益率と営業CF・FCFの改善を伴い、複数期間で持続する場合に強化。売上増だけで現金化が進まなければ無効化。","INFERENCE",[...(revGrowth?[revGrowth]:[]),...(metrics?[metrics.fcf]:[])]),
    explanation("Base：成立条件 / 無効化",baseline+"事業構成と収益性が最新開示の水準を維持する条件。価格・顧客・財務の構造変化で前提を見直す。","INFERENCE"),
    explanation("Bear：成立条件 / 反証",baseline+"需要減、利益率低下、運転資本負担または資金調達悪化が続く条件。需要回復と継続する現金化が確認できれば弱まる。","INFERENCE"));
  const monitor=[
    ["売上と需要","数量・単価・受注を分離。売上増が一時要因なら成長仮説を弱める。"],
    ["営業利益率","同じ四半期・会計条件で確認。売上増でも利益率低下なら競争・費用を確認。"],
    ["営業CFとFCF","利益が現金化するか。運転資本増で営業CFが弱ければ持続性を再評価。"],
    ["在庫・売掛金","売上との増加率の差、回収、評価損。差が拡大すれば需要・回収リスクを確認。"],
    ["Debtと資金調達","返済期限・利率・現金。金融部門や業種特性を分離して確認。"],
    ["株数と希薄化","同じ分割調整基準の期末/希薄化後株数。一株当たり利益・CFが改善しているか。"],
    ["ガイダンスと一次資料","企業の見通しと実績を分離。セグメント・顧客構成の変化で仮説を更新。"],
    ...(semiconductor?[[memory?"メモリー市況とCapEx":"顧客投資・供給・輸出規制",memory?"価格回復が供給増で反転しないか。利益率と投資負担の同時改善を確認。":"需要が実際の売上・CFへ転換するか、政策・技術更新で条件が変わらないか。"]]:[]),
  ];
  const event=company.earnings[0];
  add("earnings",event?{...explanation("次回決算予定",event.date+" / "+(event.timing??"発表時刻未確認")+"（企業IRで予定を要確認）","SOURCE CLAIM"),sourceUrl:event.source.url,sourceTitle:event.source.title,asOf:"予定取得日："+event.source.retrievedAt,period:event.period??undefined}:
    explanation("次回決算予定","予定日は未取得です。企業IRで確認してください。","UNKNOWN"),
    ...monitor.map(([label,value])=>explanation("確認項目："+label,value,"INFERENCE",metrics?[metrics.operatingMargin,metrics.fcf]:[])));
  const g1=latest&&previous?growth(latest.revenue,previous.revenue):null;
  const g0=previous&&prior?growth(previous.revenue,prior.revenue):null;
  const acceleration=g1?.value!==null && g1?.value!==undefined && g0?.value!==null && g0?.value!==undefined ? g1.value-g0.value:null;
  const emergingEvidence=[...(revGrowth?[revGrowth]:[]),...(profitGrowth?[profitGrowth]:[]),...(metrics?[metrics.fcf,metrics.operatingMargin]:[])];
  const observation=acceleration===null?"売上成長の加速は比較可能な3期が不足し未確認。":
    "売上成長率の前年差："+display(acceleration,"percentage points")+"。単独で構造変化・投資機会とは判定しません。";
  add("growth",explanation("Emerging Growth / Why now",observation,"INFERENCE",emergingEvidence),
    explanation("Emerging Growth / Missing evidence","市場シェア・顧客獲得・継続需要・競争優位・認知段階（Stage 1〜3）が未確認。Established / Emerging / Early Inflectionの分類は保留です。","UNKNOWN"),
    explanation("Emerging Growth / Next confirmation","次の開示で売上 → 利益率 → 営業CF → FCFの連続改善と希薄化・投資負担を確認します。","INFERENCE",emergingEvidence));
  add("notes",explanation("データ品質",free?"SEC / EDINETの公式JSON・標準XBRL数値はFACT、計算結果はCALCULATIONです。事業説明・注記・独自拡張タグを本文と個別照合したとは扱いません。":"提供元の集計データはSOURCE CLAIM。企業IR・法定開示をまだ個別照合していません。SOURCE CLAIMと一次資料確認済みFACTを区別します。","UNKNOWN"),
    explanation("更新時刻と取得時刻","提供元更新日："+(company.updatedAt??"未取得")+" / 取得時刻："+company.retrievedAt+"。取得時刻を決算日・株価時刻に置き換えません。",identityKind),
    explanation("非取得データ","正常化利益、維持CapEx、セグメント、成長市場規模、経営者の発言、会計基準・分割調整、返済期限は追加の一次資料確認が必要です。","UNKNOWN"));
  for(const filing of company.filings??[]) add("notes",{...explanation(filing.amended?"訂正提出書類":"提出書類",filing.title+" / 提出日："+filing.filed+" / 対象決算期："+(filing.period??"未確認"),"FACT"),sourceUrl:filing.url,sourceTitle:filing.title,asOf:filing.filed,filingDate:filing.filed,period:filing.period??undefined});
  if(company.provider==="EDINET")add("notes",{...explanation("EDINET出典・加工表示","出典：金融庁EDINET。公式公開データをもとにTUTTOが正規化・算定しました。PDL1.0の適用範囲と条件に従います。原本・タクソノミ等の権利を一律に再許諾するものではありません。","UNKNOWN"),sourceUrl:"https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0030.html",sourceTitle:"EDINET利用規約 / PDL1.0"});
  if (company.website) add("notes",{...explanation("企業公式サイト（一次資料を探す入口）","公式サイトからIR・年次報告を確認してください。本文の確認済み出典とは扱いません。","UNKNOWN"),sourceUrl:company.website,sourceTitle:"企業公式サイト"});
  if (company.cik) add("notes",{...explanation("SEC filings（一次資料を探す入口）","10-K / 10-Qの事業・セグメント・リスク・注記を照合してください。","UNKNOWN"),sourceUrl:"https://www.sec.gov/edgar/browse/?CIK="+company.cik,sourceTitle:"SEC EDGAR"});
  if (company.identity.country==="JP") add("notes",{...explanation("日本の一次資料を探す入口","EDINET・企業IRの連結財務、事業・リスク・決算予定を照合してください。","UNKNOWN"),sourceUrl:"https://disclosure2.edinet-fsa.go.jp/",sourceTitle:"金融庁 EDINET"});
  const issues=[...company.issues];
  if (issues.length) issues.unshift({code:"PARTIAL_DATA",message:"一部データが未取得または未確認です。算定・結論を保留した項目を確認してください。"});
  return {companyName:company.identity.name,symbol:company.identity.symbol,analyzedAt:now,sections,
    metadata:{provider:company.provider??"EODHD",mode:company.mode??"COMMERCIAL",valuationStatus:company.valuationStatus??"AVAILABLE",retrievedAt:company.retrievedAt,providerUpdatedAt:company.updatedAt,
      fiscalDate:latest?.end??null,currency:latest?.currency??null,priceAsOf:company.quote?.price.source.asOf??null,issues},
    emerging:{observation,evidence:emergingEvidence,missing:["市場シェア","顧客獲得","競争優位","継続需要","認知段階"],risks:sections.risk??[],
      classification:"UNVERIFIED",nextConfirmation:"次回決算で需要からFCFへの転換と一株当たりの成長を確認"},
  };
}
export function comparisonWarnings(a:StockReport,b:StockReport):string[] {
  const warnings=["会計基準・連結範囲・分割調整・独自拡張項目の個別照合は未確認。単純な優劣判定は行いません。"];
  if (a.symbol===b.symbol) warnings.push("同一企業・市場です。比較対象を変更してください。");
  if (!a.metadata?.fiscalDate || !b.metadata?.fiscalDate || a.metadata.fiscalDate!==b.metadata.fiscalDate) warnings.push("決算期が一致しないか未取得です。金額・成長率を直接比較しないでください。");
  if (!a.metadata?.currency || !b.metadata?.currency || a.metadata.currency!==b.metadata.currency) warnings.push("財務通貨が一致しないか未取得です。為替換算した比較値は生成していません。");
  if (a.metadata?.issues.length || b.metadata?.issues.length) warnings.push("片方または両方に部分データがあります。未取得をゼロとして比較しません。");
  return warnings;
}
