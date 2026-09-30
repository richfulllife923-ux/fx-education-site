// Official EDINET API index maintenance. Key is read only from the server environment.
require("../tests/stock-analysis/register.cjs");
const fs=require("node:fs"),path=require("node:path");
const {PrimaryHttp}=require("../server/stock-analysis/primary-http.ts");
const {mergeEdinetRows}=require("../server/stock-analysis/edinet.ts");
let key=process.env.EDINET_API_KEY;
const localVars=path.resolve(__dirname,"../.dev.vars");
if(!key && fs.existsSync(localVars))for(const line of fs.readFileSync(localVars,"utf8").split(/\r?\n/)){const match=/^\s*EDINET_API_KEY\s*=\s*(.*)$/.exec(line);if(match)key=match[1].trim().replace(/^(['"])(.*)\1$/,"$2");}
const target=path.resolve(__dirname,"../server/stock-analysis/edinet-filings.json");
const args=process.argv.slice(2);
const option=(name,fallback)=>{const at=args.indexOf(name);return at<0?fallback:args[at+1];};
const add=(date,days)=>new Date(Date.parse(date)+days*86400000).toISOString().slice(0,10);
const valid=value=>typeof value==="string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && add(value,0)===value;
(async()=>{
 if(!key?.trim())throw new Error("EDINET_API_KEY is required in the server environment. Never paste it in chat.");
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const initial=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,"utf8")):{version:1,coveredThrough:null,retrievedAt:null,filings:[]};
 const oldest=add(today,-5*366),start=option("--from",initial.coveredThrough?add(initial.coveredThrough,1):oldest);
 const end=option("--through",today),max=Number(option("--max-days","31"));
 if(!valid(start)||!valid(end)||start<oldest||end>today||!Number.isInteger(max)||max<1||max>2000)throw new Error("Invalid date range or --max-days (1..2000).");
 if(initial.coveredThrough && start>add(initial.coveredThrough,1))throw new Error("Index coverage cannot skip submission dates.");
 const http=new PrimaryHttp(fetch,1100),index={...initial,version:1,historyStart:initial.historyStart??start};
 let count=0;
 for(let date=start;date<=end && count<max;date=add(date,1)){
  const result=await http.json("https://api.edinet-fsa.go.jp/api/v2/documents.json?date="+date+"&type=2&Subscription-Key="+encodeURIComponent(key),"list."+date,0);
  if(String(result.data?.metadata?.status)!=="200" || !Array.isArray(result.data?.results))throw new Error("EDINET list status is not successful.");
  index.filings=mergeEdinetRows(index.filings,result.data.results);index.retrievedAt=result.retrievedAt;
  if(!index.coveredThrough || date>index.coveredThrough)index.coveredThrough=date;
  fs.writeFileSync(target+".tmp",JSON.stringify(index,null,2)+"\n","utf8");fs.renameSync(target+".tmp",target);
  count++;if(count%7===0 || date===end || count===max)console.log(date+" / indexed financial filings: "+index.filings.length);
 }
 console.log("Covered through: "+(index.coveredThrough??"none")+". Run again to resume; use --from to recheck earlier metadata. No key is written to the index.");
})().catch(()=>{console.error("EDINET index update stopped. Check the key, dates, access conditions and network; completed dates remain saved. Secret URLs/errors are never printed.");process.exitCode=1;});
