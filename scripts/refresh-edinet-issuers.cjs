// Official identity metadata only. Never persists keys, financial data or street addresses.
require("../tests/stock-analysis/register.cjs");
const fs=require("node:fs"),path=require("node:path");
const {readZip,parseCsv}=require("../server/stock-analysis/zip.ts");
(async()=>{
  const url="https://disclosure2dl.edinet-fsa.go.jp/searchdocument/codelist/Edinetcode.zip";
  const response=await fetch(url,{redirect:"error"});if(!response.ok)throw new Error("EDINET code download failed");
  const files=await readZip(new Uint8Array(await response.arrayBuffer()),name=>name.endsWith(".csv"),4*1024*1024);
  if(files.length!==1)throw new Error("Unexpected official code archive");
  // Shift-JIS conversion is offline maintenance only; Workers consume UTF-8 JSON.
  const rows=parseCsv(new TextDecoder("shift_jis").decode(files[0].bytes)),header=rows[1];
  const column=name=>{const index=header.indexOf(name);if(index<0)throw new Error("Code schema changed");return index;};
  const indices={code:column("証券コード"),edinet:column("ＥＤＩＮＥＴコード"),name:column("提出者名"),english:column("提出者名（英字）"),
    kind:column("提出者種別"),listed:column("上場区分"),industry:column("提出者業種")};
  const issuers=rows.slice(2).flatMap(row=>{
    const security=row[indices.code];
    if(row[indices.kind]!=="内国法人・組合" || row[indices.listed]!=="上場" || !/^[1-9][0-9]{2}[A-Z0-9]0$/.test(security) || !/^E\d{5}$/.test(row[indices.edinet]))return [];
    return [{code:security.slice(0,4),edinetCode:row[indices.edinet],name:row[indices.name],englishName:row[indices.english],industry:row[indices.industry]}];
  });
  const retrievedAt=new Date().toISOString(),output=path.resolve(__dirname,"../server/stock-analysis/edinet-issuers.json");
  const stamp=rows[0].join(" ").match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  fs.writeFileSync(output,JSON.stringify({version:1,sourceUrl:url,retrievedAt,asOf:stamp?stamp[1]+"-"+stamp[2].padStart(2,"0")+"-"+stamp[3].padStart(2,"0"):null,issuers})+"\n");
  console.log(JSON.stringify({source:"Official EDINET issuer list",count:issuers.length,priority:issuers.filter(row=>["7203","285A"].includes(row.code)),output},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
