import { StockError } from "./model";
/** Bounded ZIP reader. No extraction to disk, no encrypted/ZIP64/multi-volume support. */
export async function readZip(bytes:Uint8Array,accept:(name:string)=>boolean,maxSize=12*1024*1024):Promise<{name:string;bytes:Uint8Array}[]> {
  try{
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const u16=(at:number)=>view.getUint16(at,true),u32=(at:number)=>view.getUint32(at,true);
    let eocd=-1;
    for(let at=bytes.length-22;at>=Math.max(0,bytes.length-65557);at--)if(u32(at)===0x06054b50){eocd=at;break;}
    if(eocd<0 || u16(eocd+4)!==0 || u16(eocd+6)!==0)throw new Error("ZIP");
    const count=u16(eocd+10),offset=u32(eocd+16);if(count>4096 || count===65535 || offset===0xffffffff)throw new Error("ZIP64");
    let position=offset,total=0;const output:{name:string;bytes:Uint8Array}[]=[];
    for(let i=0;i<count;i++){
      if(u32(position)!==0x02014b50)throw new Error("directory");
      const flags=u16(position+8),method=u16(position+10),crc=u32(position+16),
        compressed=u32(position+20),size=u32(position+24),nameLength=u16(position+28),
        extra=u16(position+30),comment=u16(position+32),local=u32(position+42);
      const name=new TextDecoder().decode(bytes.subarray(position+46,position+46+nameLength));
      position+=46+nameLength+extra+comment;
      if(!accept(name))continue;
      if(flags&1 || ![0,8].includes(method) || size>maxSize || total+size>maxSize || output.length>=16)throw new Error("unsafe ZIP");
      if(u32(local)!==0x04034b50)throw new Error("local");
      if(u16(local+6)!==flags || u16(local+8)!==method || new TextDecoder().decode(bytes.subarray(local+30,local+30+u16(local+26)))!==name)throw new Error("header mismatch");
      const start=local+30+u16(local+26)+u16(local+28);
      if(start+compressed>bytes.length)throw new Error("bounds");
      let data=bytes.subarray(start,start+compressed);
      if(method===8){
        const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat));
        const reader=stream.getReader(),chunks:Uint8Array[]=[];let length=0;
        for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;
          if(length>size || total+length>maxSize){await reader.cancel();throw new Error("inflate limit");}chunks.push(value);}
        data=new Uint8Array(length);let at=0;chunks.forEach(chunk=>{data.set(chunk,at);at+=chunk.length;});
      }
      if(data.length!==size || crc32(data)!==crc)throw new Error("integrity");
      total+=size;output.push({name,bytes:data});
    }
    return output;
  }catch{throw new StockError("DATA_PROVIDER_ERROR","一次資料ZIPの形式・容量・整合性を確認できませんでした。");}
}
const crcTable=Uint32Array.from({length:256},(_,value)=>{let crc=value;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);return crc>>>0;});
function crc32(bytes:Uint8Array):number {
  let crc=0xffffffff;
  for(const byte of bytes)crc=(crc>>>8)^crcTable[(crc^byte)&255];
  return (crc^0xffffffff)>>>0;
}
export function parseCsv(text:string):string[][] {
  const rows:string[][]=[];let row:string[]=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const character=text[i];
    if(character==='"'){if(quoted && text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(character==="," && !quoted){row.push(field);field="";}
    else if((character==="\n" || character==="\r") && !quoted){
      if(character==="\r" && text[i+1]==="\n")i++;
      row.push(field);if(row.some(value=>value))rows.push(row);row=[];field="";
    }else field+=character;
  }
  if(quoted)throw new StockError("DATA_PROVIDER_ERROR","CSVの引用符が閉じていません。");
  if(field || row.length){row.push(field);rows.push(row);}return rows;
}
