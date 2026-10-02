// Isolated UI TEST DATA only. No provider, candidate selection or production fixture.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),Module=require("node:module"),ts=require("typescript");
const React=require("react"),{renderToStaticMarkup}=require("react-dom/server");
const file=path.resolve(__dirname,"../../components/stock-analysis/ResearchEvidenceCard.tsx");
const source=fs.readFileSync(file,"utf8").replace('"@/lib/stock-analysis-presentation"',JSON.stringify(path.resolve(__dirname,"../../lib/stock-analysis-presentation.ts")));
const componentModule=new Module(file,module);componentModule.paths=module.paths;
componentModule._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
const Card=componentModule.exports.default;
function value(){
 const decision={status:"UNVERIFIED",reason:"TEST DATA 不足",missingItems:["TEST DATA 要確認"],evidenceRefs:["source"],confidence:"UNVERIFIED",predicateTrace:[]};
 return {ruleVersion:"TEST DATA",fiscalDate:"2026-03-31",business:{...decision},majorRisk:{...decision},cashFlowSustainability:{...decision},counterThesis:{...decision},provenance:{source:{url:"https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100TEST"}},coverage:{},sourceCandidates:0,structuredFacts:0,relations:0,extractionIssues:[]};
}
test("UI maps all four engine states without recomputing or promoting them",()=>{
 const v=value(),before=structuredClone(v);v.business.status="MET";v.majorRisk.status="NOT_MET";v.cashFlowSustainability.status="PARTIAL";
 const expected=structuredClone(v),html=renderToStaticMarkup(React.createElement(Card,{value:v}));
 for(const label of ["確認済み","条件不成立","主要確認・細部待ち","未確認"])assert.ok(html.includes(label));
 assert.deepEqual(v,expected);assert.equal(before.counterThesis.status,v.counterThesis.status);
 assert.ok(html.includes("確認根拠を見る"));assert.ok(html.includes("<details"));assert.ok(!html.includes("<details open"));
});
test("UI links only official human-view EDINET documents and escapes source text",()=>{
 for(const url of ["https://api.edinet-fsa.go.jp/api/v2/documents/S100TEST?type=1","https://third-party.example/data.zip","javascript:alert(1)"]){
  const v=value();v.provenance.source.url=url;v.business.reason="<script>TEST DATA</script>";
  const html=renderToStaticMarkup(React.createElement(Card,{value:v}));assert.ok(!html.includes('href="'+url+'"'));assert.ok(!html.includes("<script>TEST DATA</script>"));
 }
 const html=renderToStaticMarkup(React.createElement(Card,{value:value()}));assert.ok(html.includes("WZEK0040.aspx?S100TEST"));assert.ok(html.includes("noopener noreferrer"));
});
