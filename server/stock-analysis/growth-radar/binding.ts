import type {ChangeFact,ChangeRelation,EconomicLayer,EvidenceRef,RelationType} from "./model";
type Clause={layer:EconomicLayer;metric:string;direction:ChangeFact["direction"]};
const uncertain=/ではない|によるものでは|なかった|していない|すれば|場合|ならば|期待|見込|予定|可能性|予想|予測|今後|かつて|過去|前期は|前年度は|\b(?:not|never|may|might|could|would|will|expected|expectation|forecast|possibly|historically|previously|if)\b/i;
const compound=/及び|および|並びに|または|と為替|と需要|と顧客|\b(?:and|or)\b/i;
function clean(s:string){return s.trim().replace(/[。.!]$/,"").trim().replace(/^(?:当期は|当連結会計年度は|当年度は|During this period,?\s*)/i,"");}
/** A deliberately bounded grammar. Unsupported clauses stay unknown; connectors alone never classify meaning. */
function clause(value:string):Clause|null{
 const s=clean(value);if(!s||uncertain.test(s)||compound.test(s))return null;
 if(/^新規顧客[^、。]*への供給を開始した$/.test(s)||/^new customer (?:acquisition|supply (?:started|commenced))$/i.test(s))return {layer:"CUSTOMER",metric:"NEW_CUSTOMER",direction:"START"};
 const nouns:[EconomicLayer,string,string][]=[
  ["DEMAND","DEMAND","(?:[A-Za-z0-9一-龥ァ-ヶー]+)?需要"],
  ["CAPACITY","CAPACITY","(?:生産能力|生産量|供給能力)"],
  ["REVENUE","REVENUE","(?:[A-Za-z0-9ァ-ヶー]+)?(?:売上高|売上|収益)"],
  ["MARGIN_PROFIT","PROFIT","(?:営業利益|純利益|利益率|営業利益率|利益)"],
  ["OCF","OCF","(?:営業CF|営業キャッシュ・フロー|営業キャッシュフロー)"],
  ["FCF","FCF","(?:FCF|フリーCF|フリーキャッシュフロー)"],
  ["CONTRACT_ORDER","ORDERS","(?:受注高|受注残|受注)"]
 ];
 for(const [layer,metric,noun]of nouns){
  // Actual past statement or a change noun explicitly bound by the containing causal sentence.
  if(new RegExp("^"+noun+"(?:の)?(?:増加|拡大|改善|成長)$").test(s)||
     new RegExp("^"+noun+"(?:は|が)(?:前年同期比で|前年比で)?(?:増加|拡大|改善|成長)した$").test(s))
    return {layer,metric,direction:"INCREASE"};
 }
 const english:[EconomicLayer,string,RegExp][]=[
 ["DEMAND","DEMAND",/^(?:demand (?:growth|increase|increased)|increased demand)$/i],
 ["CUSTOMER","NEW_CUSTOMER",/^new customer acquisition$/i],
 ["CAPACITY","CAPACITY",/^(?:increased production|(?:production )?capacity (?:expansion|increased)|expanded (?:production )?capacity)$/i],
 ["REVENUE","REVENUE",/^(?:revenue (?:growth|increase|increased)|increased revenue)$/i],
 ["MARGIN_PROFIT","PROFIT",/^(?:profit (?:growth|increase|increased)|margin (?:improvement|improved))$/i],
 ["OCF","OCF",/^operating cash flow (?:growth|increase|increased|improved)$/i],
 ["FCF","FCF",/^free cash flow (?:growth|increase|increased|improved)$/i],
 ["CONTRACT_ORDER","ORDERS",/^(?:orders|backlog) (?:growth|increase|increased)$/i]
 ];
 for(const [layer,metric,re]of english)if(re.test(s))return {layer,metric,direction:"INCREASE"};
 return null;
}
type Sentence={text:string;start:number;end:number};
function sentences(text:string):Sentence[]{
 const out:Sentence[]=[];for(const m of text.matchAll(/[^。!?\n]+[。!?]?/g)){
  // English period boundaries; decimal-containing unsupported prose fails closed.
  let cursor=0;
  for(const part of m[0].split(/(?<=\.)\s+/)){
   const position=m[0].indexOf(part,cursor),offset=m.index!+position;
   const trim=part.trim(),at=part.indexOf(trim);if(trim)out.push({text:trim,start:offset+at,end:offset+at+trim.length});cursor=position+part.length;
  }
 }return out;
}
function relationParts(s:string):{trigger:string;effect:string;type:RelationType}|null{
 let m=/^(.+?)(?:により|によって|を背景に|に伴い)、?\s*(.+)$/.exec(clean(s));
 if(m)return {trigger:m[1],effect:m[2],type:"CAUSES"};
 m=/^(.+?)が(?:、?\s*)(.+?)に寄与した$/.exec(clean(s));
 if(m)return {trigger:m[1],effect:m[2],type:"CONTRIBUTES_TO"};
 m=/^(.+?) (contributed to|enabled|led to|resulted in|drove) (.+)$/i.exec(clean(s));
 if(m)return {trigger:m[1],effect:m[3],type:({"contributed to":"CONTRIBUTES_TO","enabled":"ENABLES","led to":"LEADS_TO","resulted in":"RESULTS_IN","drove":"DRIVES"} as Record<string,RelationType>)[m[2].toLowerCase()]};
 m=/^(.+?) (due to|because of|attributable to|driven by|resulting from|as a result of) (.+)$/i.exec(clean(s));
 if(m)return {trigger:m[3],effect:m[1],type:m[2].toLowerCase()==="driven by"?"DRIVES":"CAUSES"};
 return null;
}
export function bindSource(source:EvidenceRef):{facts:ChangeFact[];relations:ChangeRelation[]}{
 const facts:ChangeFact[]=[],relations:ChangeRelation[]=[];
 if(source.format!=="TEXT")return {facts,relations};
 function fact(value:string,sentence:Sentence):ChangeFact|null{
  const c=clause(value);if(!c)return null;
  const exact=value.trim(),within=sentence.text.indexOf(exact);if(within<0)return null;
  const start=sentence.start+within,end=start+exact.length;
  const id=source.id+"#"+start+":"+end+":"+c.metric;
  const found=facts.find(f=>f.id===id);if(found)return found;
  const f:ChangeFact={id,companyId:source.companyId,securityCode:source.securityCode,...c,currentPeriod:source.period,priorPeriod:null,
   sourceRef:source.id,quote:source.text.slice(start,end),span:{start,end},currentValue:null,priorValue:null,
   classification:"MANAGEMENT_REPORTED_CHANGE",confidence:"CONFIRMED"};facts.push(f);return f;
 }
 const list=sentences(source.text);
 for(let i=0;i<list.length;i++){
  const s=list[i];if(uncertain.test(s.text))continue;
  // Explicit historical year in current-period prose is not silently rebound to the current period.
  if([...s.text.matchAll(/(20\d{2})年/g)].some(m=>m[1]!==source.period.slice(0,4)))continue;
  const p=relationParts(s.text);let trigger:ChangeFact|null=null,effect:ChangeFact|null=null;
  let type:RelationType="RESULTS_IN",binding:ChangeRelation["binding"]="SAME_SENTENCE",start=s.start;
  if(p){trigger=fact(p.trigger,s);effect=fact(p.effect,s);type=p.type;}
  else{
   const ref=/^(?:この結果、?|その結果、?|As a result,\s*)(.+)$/i.exec(s.text);
   const prior=list[i-1];
   if(ref&&prior&&!uncertain.test(prior.text)){
    // Exactly one preceding complete clause, same bounded paragraph; no ambiguous antecedent search.
    trigger=fact(prior.text,prior);effect=fact(ref[1],s);binding="EXPLICIT_ADJACENT_REFERENCE";start=prior.start;
   }else fact(s.text,s);
  }
  if(trigger&&effect&&trigger.id!==effect.id&&trigger.layer!==effect.layer){
   relations.push({id:source.id+"#relation:"+start+":"+s.end,triggerFactId:trigger.id,effectFactId:effect.id,
    sourceRef:source.id,sourcePeriod:source.period,relationType:type,provenance:"MANAGEMENT_ATTRIBUTED",
    classification:"MANAGEMENT_ATTRIBUTED_RELATION",span:{start,end:s.end},quote:source.text.slice(start,s.end),binding});
  }
 }
 return {facts,relations};
}
