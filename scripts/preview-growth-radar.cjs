// Local-only static export + real Pages handler + private saved snapshot. No discovery or deployment.
require('../tests/stock-analysis/register.cjs');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {onRequest}=require('../functions/api/stock-analysis/[[path]].ts');
const root=path.resolve(__dirname,'..'),publicRoot=path.join(root,'out'),privateRoot=path.join(root,'.stock-test-output');
function createPreview(snapshotFile,{delay=0,unavailable=false}={}){
 const absolute=path.resolve(snapshotFile);
 if(!absolute.startsWith(privateRoot+path.sep))throw Error('Snapshot must stay in the private local artifact directory');
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};
 return http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://'+req.headers.host);
   if(url.pathname.startsWith('/api/stock-analysis/')){
    if(url.pathname.replace(/\/+$/,'')!=='/api/stock-analysis/featured'){res.writeHead(404).end();return;}
    if(delay)await new Promise(r=>setTimeout(r,delay));
    const store={get:async()=>{if(unavailable)throw Error('Local QA storage unavailable');return fs.existsSync(absolute)?JSON.parse(fs.readFileSync(absolute,'utf8')):null;}};
    const response=await onRequest({request:new Request(url,{method:req.method}),env:{TOP3_RESEARCH_RUN:store,STOCK_RATE_LIMITER:{limit:async()=>({success:true})}}});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
   }
   const filePath=path.resolve(publicRoot,'.'+decodeURIComponent(url.pathname));
   if(filePath!==publicRoot&&!filePath.startsWith(publicRoot+path.sep)){res.writeHead(403).end();return;}
   let file=filePath;if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
   res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream'});res.end(fs.readFileSync(file));
  }catch{res.writeHead(503,{'Content-Type':'application/json'}).end(JSON.stringify({status:'error',message:'Local saved result unavailable'}));}
 });
}
module.exports={createPreview};
if(require.main===module){
 const port=Number(process.argv[2]??4180),file=process.argv[3]??path.join(privateRoot,'growth-radar-discovery','growth-snapshot.json');
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local port');
 createPreview(file).listen(port,'127.0.0.1',()=>console.log('Local preview http://127.0.0.1:'+port+'/stock-analysis/watchlist/ — saved data only; no crawl'));
}
