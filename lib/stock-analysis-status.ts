export const usPrimaryUnavailableCode = "US_PRIMARY_SOURCE_TEMPORARILY_UNAVAILABLE";
export const usPrimaryUnavailableMessage = "米国株の一次資料接続は現在メンテナンス中です。SEC公式データへの接続確認中のため、米国株の実データ分析を一時停止しています。日本株分析は通常どおり利用できます。復旧後に利用可能になります。";
export function isUsPrimaryUnavailable(result:{status:string;code?:string}|null|undefined):boolean {
  return !!result && result.status!=="ready" && result.code===usPrimaryUnavailableCode;
}
