// Existing TypeScript compiler; no test dependency or production require hook.
const fs=require("node:fs"),ts=require("typescript");
require.extensions[".ts"]=(module,file)=>{
  const source=fs.readFileSync(file,"utf8");
  module._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
};
