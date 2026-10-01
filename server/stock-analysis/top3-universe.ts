import type { EdinetIndex } from "./edinet";
import { isDisclosed } from "./edinet";
import type { UniverseIdentity } from "../../lib/top3-selection";
import { dateOrNull } from "./model";
export function universeFilings(universe:UniverseIdentity[],index:EdinetIndex,asOf:string){
 if(!dateOrNull(asOf)||index.version!==1)throw new Error("Invalid universe snapshot");
 const identities=new Map(universe.map(i=>[i.edinetCode,i]));
 const grouped=new Map<string,EdinetIndex["filings"]>();
 for(const row of index.filings){const id=identities.get(row.edinetCode);
  if(!id||row.secCode!==id.code+"0"||!isDisclosed(row)||!row.periodEnd||row.periodEnd>asOf||row.submitDateTime.slice(0,10)>asOf)continue;
  const list=grouped.get(id.edinetCode)??[];list.push(row);grouped.set(id.edinetCode,list);
 }
 return universe.map(identity=>{
  const rows=(grouped.get(identity.edinetCode)??[]).sort((a,b)=>b.periodEnd!.localeCompare(a.periodEnd!)||b.submitDateTime.localeCompare(a.submitDateTime)||b.docID.localeCompare(a.docID));
  const annual=rows.find(r=>["120","130"].includes(r.docTypeCode));
  const latestDocuments=[annual,...["HALF","QUARTER"].map(group=>rows.find(r=>(group==="HALF"?["160","170"]:["140","150"]).includes(r.docTypeCode)))].filter((r):r is NonNullable<typeof r>=>!!r).map(r=>r.docID).sort();
  return {identity,latestAnnual:annual?.periodEnd??null,latestDocuments,filingAvailable:!!annual&&annual.xbrlFlag==="1"};
 });
}
