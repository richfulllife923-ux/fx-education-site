import { usPrimaryUnavailableCode,usPrimaryUnavailableMessage } from "../../lib/stock-analysis-status";
import { SecProvider } from "./sec";
import { EdinetProvider,type EdinetIndex } from "./edinet";
import { StockError,type Candidate,type StockProvider } from "./model";
export class FreeProvider implements StockProvider {
  private edinet:EdinetProvider;
  private sec?:SecProvider;
  constructor(private contact:string|undefined,key:string|undefined,index?:EdinetIndex,
    private fetcher:typeof fetch=fetch,private clock:()=>Date=()=>new Date(),private interval=1100,private secLiveEnabled=false) {
    this.edinet=new EdinetProvider(key,index,fetcher,clock,interval);
  }
  private us():SecProvider {if(!this.secLiveEnabled)throw new StockError(usPrimaryUnavailableCode,usPrimaryUnavailableMessage);return this.sec??=new SecProvider(this.contact,this.fetcher,this.clock,this.interval);}
  async search(query:string,market?:Candidate["exchange"]):Promise<Candidate[]> {
    if(market==="US")return this.us().search(query);
    if(market==="JP" || market==="TSE")return this.edinet.search(query);
    const japanese=await this.edinet.search(query);
    // Japan security codes are also checked against SEC to avoid silent numeric-ticker collisions.
    if(/^[0-9]{3}[A-Z0-9]$/.test(query)){
      if(!this.secLiveEnabled || !this.contact)return japanese;
      try{return japanese.concat(await this.us().search(query));}
      catch(error){if(japanese.length)throw new StockError("AMBIGUOUS_SYMBOL","日本の証券コードは確認できましたが、米国市場との照合が接続制限で未完了です。日本市場の候補を選ぶか、市場付きコードを入力してください。",japanese);throw error;}
    }
    if(japanese.length || /[^\x00-\x7f]/.test(query))return japanese;
    return this.us().search(query);
  }
  company(candidate:Candidate) {
    if(candidate.exchange==="US")return this.us().company(candidate);
    if(candidate.exchange==="JP")return this.edinet.company(candidate);
    throw new StockError("INVALID_INPUT","無料公式データで対応する市場識別子を確認してください。");
  }
}
