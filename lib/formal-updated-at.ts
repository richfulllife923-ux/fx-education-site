/** Formats the saved formal generation time, never the access or refresh time. */
export function formalUpdatedAtJst(generatedAt:string|null|undefined):string|null{
 if(!generatedAt||!/(?:Z|[+-]\d{2}:\d{2})$/.test(generatedAt)||!Number.isFinite(Date.parse(generatedAt)))return null;
 const parts=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(generatedAt));
 const value=(type:string)=>parts.find(p=>p.type===type)!.value;
 return value('year')+'/'+value('month')+'/'+value('day')+' '+value('hour')+':'+value('minute')+' JST';
}
