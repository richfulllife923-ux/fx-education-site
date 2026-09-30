const {chromium}=require(process.env.PLAYWRIGHT_MODULE||"playwright");
(async()=>{const browser=await chromium.launch({headless:true,channel:"chrome"});try{
  const page=await browser.newPage({viewport:{width:768,height:900}});
  const response=await page.goto("https://fx-education-site.pages.dev/framework/structure-theory/",{waitUntil:"networkidle"});
  console.log(JSON.stringify({baseline:"currently published protected framework",status:response.status(),
    metrics:await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      overflowNodes:[...document.querySelectorAll("main *")].filter(node=>node.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(node=>({tag:node.tagName,class:node.className,text:node.textContent.slice(0,80)}))}))},null,2));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
