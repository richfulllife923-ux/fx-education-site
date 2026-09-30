// TEST DATA ONLY. Synthetic amounts, synthetic descriptions and dates. Never import in production.
const definitions={
  "7203.TSE":{Code:"7203",CountryISO:"JP",CurrencyCode:"JPY",Exchange:"TSE",Name:"Toyota Motor Corporation [TEST DATA]",Sector:"Consumer Cyclical",Industry:"Auto Manufacturers"},
  "285A.TSE":{Code:"285A",CountryISO:"JP",CurrencyCode:"JPY",Exchange:"TSE",Name:"Kioxia Holdings [TEST DATA]",Sector:"Technology",Industry:"Semiconductor Memory"},
  "NVDA.US":{Code:"NVDA",CountryISO:"US",CurrencyCode:"USD",Exchange:"NASDAQ",Name:"NVIDIA Corporation [TEST DATA]",Sector:"Technology",Industry:"Semiconductors"},
  "AAPL.US":{Code:"AAPL",CountryISO:"US",CurrencyCode:"USD",Exchange:"NASDAQ",Name:"Apple Inc [TEST DATA]",Sector:"Technology",Industry:"Consumer Electronics"},
  "MSFT.US":{Code:"MSFT",CountryISO:"US",CurrencyCode:"USD",Exchange:"NASDAQ",Name:"Microsoft [TEST DATA]"},
  "GOOGL.US":{Code:"GOOGL",CountryISO:"US",CurrencyCode:"USD",Exchange:"NASDAQ",Name:"Alphabet [TEST DATA]"},
};
function payload(symbol="NVDA.US"){
  const general=definitions[symbol];if(!general)return null;
  const currency=general.CurrencyCode;
  const financials={};
  ["Income_Statement","Cash_Flow","Balance_Sheet"].forEach(name=>financials[name]={currency_symbol:currency,yearly:{},quarterly:{}});
  for(let year=2021;year<=2025;year++){
    const date=year+"-12-31",n=year-2020,common={date,filing_date:(year+1)+"-02-01",currency_symbol:currency};
    financials.Income_Statement.yearly[date]={...common,totalRevenue:String(100*n),grossProfit:String(40*n),operatingIncome:String(20*n),netIncome:String(10*n)};
    financials.Cash_Flow.yearly[date]={...common,totalCashFromOperatingActivities:String(30*n),capitalExpenditures:String(-10*n),
      totalCashflowsFromInvestingActivities:String(-10*n),totalCashFromFinancingActivities:"-5",stockBasedCompensation:"2"};
    financials.Balance_Sheet.yearly[date]={...common,cashAndEquivalents:"100",shortTermInvestments:"20",shortLongTermDebtTotal:"30",
      totalStockholderEquity:"200",totalAssets:"300",netReceivables:String(20*n),inventory:String(10*n),commonStockSharesOutstanding:"10"};
  }
  const quarterly={date:"2026-06-30",filing_date:"2026-08-01",currency_symbol:currency,totalRevenue:"160",operatingIncome:"35",netIncome:"15"};
  financials.Income_Statement.quarterly["2026-06-30"]=quarterly;
  return {General:{...general,Type:"Common Stock",Description:"Synthetic TEST DATA business description.",
    WebURL:"https://example.com/test-ir",UpdatedAt:"2026-09-29",CIK:general.CountryISO==="US"?"0000000001":null},
    Financials:financials,Highlights:{EarningsShare:5},Valuation:{TrailingPE:10,PriceBookMRQ:2,EnterpriseValueEbitda:8,PriceSalesTTM:3}};
}
function mockFetch({transform,fail=[],searchRows,delay=0}={}){
  const calls=[];
  const fetcher=async(url,options)=>{
    const parsed=new URL(url);calls.push(parsed.pathname);
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    const endpoint=parsed.pathname.split("/api/")[1];
    if(fail.some(name=>endpoint.startsWith(name)))return new Response(JSON.stringify({error:"TEST DATA provider failure"}),{status:429});
    let value;
    if(endpoint.startsWith("search/")){
      const query=decodeURIComponent(endpoint.slice(7)),exchange=parsed.searchParams.get("exchange");
      value=searchRows??Object.entries(definitions).filter(([symbol,g])=>symbol===query+"."+exchange || g.Name.toUpperCase().includes(query)).map(([symbol,g])=>({
        Code:g.Code,Exchange:symbol.split(".")[1],Name:g.Name,Type:"Common Stock",Country:g.CountryISO==="US"?"USA":"Japan",Currency:g.CurrencyCode}));
    }else if(endpoint.startsWith("v1.1/fundamentals/")){
      const symbol=decodeURIComponent(endpoint.slice("v1.1/fundamentals/".length));value=payload(symbol);if(transform)value=transform(value);
    }else if(endpoint.startsWith("real-time/")){
      const symbol=decodeURIComponent(endpoint.slice(10));value={code:symbol,timestamp:Date.parse("2026-09-30T18:00:00Z")/1000,close:50,previousClose:49};
    }else if(endpoint==="calendar/earnings"){
      value={earnings:[{code:parsed.searchParams.get("symbols"),report_date:"2026-11-05",date:"2026-09-30",currency:"USD",before_after_market:"AfterMarket"}]};
    }else return new Response("not found",{status:404});
    return new Response(JSON.stringify(value),{headers:{"Content-Type":"application/json"}});
  };
  fetcher.calls=calls;return fetcher;
}
module.exports={payload,mockFetch,definitions};
