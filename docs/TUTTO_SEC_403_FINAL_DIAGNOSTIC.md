# TUTTO SEC 403 最終診断 — 2026-10-01 JST

宣言済みUser-Agent、公式URL、低速の単発アクセスでもSubmissions / CompanyfactsはHTTP 403でした。今回の条件に従い SEC_ACCESS_EXTERNAL_BLOCK = YES とします。これは外部アクセス拒否の実測結果であり、特定IPのブロックや拒否ルールの原因を確定するものではありません。接続の復旧は未達成です。

所有者から、同じPC・回線の通常ブラウザーでAAPL SubmissionsのJSONが表示されたとの回答を受けました。公開IPは未確認です。ブラウザーの成功をプログラム接続成功とは扱いません。

## 実測結果

各URLへGETを1回ずつ実行しました。フル分析、ticker一覧取得、自動retryは実行していません。

| 項目 | Submissions | Companyfacts |
| --- | --- | --- |
| URL | https://data.sec.gov/submissions/CIK0000320193.json | https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json |
| UTC開始 | 2026-09-30T19:23:26.374Z | 2026-09-30T19:24:27.682Z |
| JST開始 | 2026-10-01 04:23:26 | 2026-10-01 04:24:27 |
| HTTP status | 403 | 403 |
| Content-Type | text/html | text/html |
| Redirect | なし | なし |
| SEC診断分類 | SEC_UNDECLARED_AUTOMATED_TOOL | SEC_UNDECLARED_AUTOMATED_TOOL |
| 本文の短い要約 | 宣言されていない自動化ツールとしてアクセスを拒否 | 同左 |
| SEC Reference ID | 0.ebd5d717.1790796206.28f1d15 | 0.ebd5d717.1790796267.28fbc29 |
| Response Date | Wed, 30 Sep 2026 19:23:26 GMT | Wed, 30 Sep 2026 19:24:27 GMT |
| Server | AkamaiGHost | AkamaiGHost |
| Content-Length | 2163 | 2164 |
| Content-Encoding | gzip | gzip |
| Connection | keep-alive | keep-alive |

最初の403で61秒のクールダウンに入り、前回完了から61,003ms待って別endpointを試験しました。並列数1、自動retry0、診断設定の最低間隔1,100ms。第2試験も403となり、その後SECアクセスを停止しました。

## 実際の送信ヘッダー

Node.js native fetch / Undiciの診断イベント undici:client:sendHeaders を購読し、ソケットへ書き出す直前の直列化済みHTTPヘッダーを読み取りました。読み取りのみで送信への介入はしていません。メールは保存・出力前にマスクしています。

両方の実送信で確認した必須項目:

    Host: data.sec.gov
    User-Agent: TUTTO Stock Analysis [configured email redacted]
    Accept-Encoding: gzip, deflate
    Accept: application/json

User-Agentはサーバー設定 SEC_CONTACT_EMAIL と完全一致しています。TLS server nameも data.sec.gov でした。Nodeが付加した Connection: keep-alive / Accept-Language: * / Sec-Fetch-Mode: cors も観測されました。ブラウザーのUser-Agentへの変更やブラウザー偽装はありません。

HTTP_PROXY / HTTPS_PROXY / ALL_PROXY / NODE_USE_ENV_PROXY はすべて未設定でした。ただし公開IP・ネットワーク経路は未確認であり、ブラウザーとプログラムの送信元IPの一致までは検証できていません。

## ローカル変更と検証

本タスクの実装変更は server/stock-analysis/sec.ts のSEC専用ヘッダー生成だけです。従来のUser-AgentとJSON Acceptを維持し、Accept-Encoding: gzip, deflateを明示しました。連絡先はサーバー環境から読み込み、空値・空白・改行を含む値を拒否します。メール本体はログやソースに保存していません。

共有PrimaryHttpは変更せず、既存の直列化、1,100ms間隔、redirect拒否、403時クールダウンを維持しました。診断ではredirect: manualで転送を追わず、実際に3xxがなかったことも確認しました。

- ローカル単体・契約テスト: 76/76 PASS（既存73件 + SEC専用3件）。
- npm run typecheck: PASS。
- npm run build: PASS、34ページ生成・static export完了。
- API関数のWeb API ESMバンドル: PASS。新規実行依存、Node専用import、テストimportなし。
- EDINET、XBRL、発行体・提出書類索引、更新スクリプト、共有通信処理、FreeProvider、model、resolver、engine、API関数の計12ファイル: 診断前SHA-256と一致。
- EDINET実データのローカルUI回帰: 7203.JP / 285A.JP 両方PASS。12セクション、FACT/CALCULATION表示、Limited Valuation、375pxの横溢れなし、ブラウザーエラーなしを確認。
- 実測レポートの会計年度は7203.JPが2025-03-31、285A.JPが2026-03-31でした。このPASSは解析・表示の回帰確認です。以前の監査にあるToyota FY2026の取得を今回再現したとは扱わず、最新年度の選択の保証は本SEC診断に含めません。EDINET実装は変更していません。
- 秘密鍵・実連絡先の公開ソース/生成物への混入なし。サーバー秘密ファイルはGit除外。
- 診断前HEADを保持。Commit / Push / Deployは実行していません。

検証時、単体テストのワイルドカード指定が独立起動用のbrowser.test.cjsも読み込み、既定のplaywright解決で起動エラーになりました。正しい3ファイルを指定して76件すべてPASSを確認しました。EDINETブラウザー回帰は別途、利用可能な既存ランタイムから起動して完了しています。依存の追加はありません。

## 問い合わせ用準備

SEC公式FAQのAccess Denied案内に従い、webmaster@sec.gov宛ての英文下書きを .stock-test-output/SEC_WEBMASTER_REQUEST_DRAFT.txt に作成しました。設定済みの公開連絡先、宣言アプリ名、送信ヘッダー、時刻、URL、HTTP 403、本文要約、SEC Reference IDを記載しました。公開IP欄は所有者による確認・記入待ちです。秘密鍵を含まず、送信は実行していません。

マスク済みの実測詳細は .stock-test-output/sec-final-diagnostic.json、EDINET回帰結果は .stock-test-output/sec-diagnostic-edinet-regression.json にあります。下書きと診断出力はGit除外ディレクトリ内です。

## 最終ステータス

    SEC_USER_AGENT_VALID = YES
    SEC_RATE_LIMIT_VALID = YES
    SEC_ENDPOINT_VALID = YES
    SEC_SINGLE_REQUEST_STATUS = HTTP 403
    SEC_COMPANYFACTS_STATUS = HTTP 403
    SEC_SUBMISSIONS_STATUS = HTTP 403
    SEC_ACCESS_EXTERNAL_BLOCK = YES
    NVDA_E2E = BLOCKED
    AAPL_E2E = BLOCKED
    EDINET_REGRESSION = PASS (7203 / 285A; implementation unchanged)
    BUILD = PASS
    TYPESCRIPT = PASS
    COMMIT_EXECUTED = NO
    PUSH_EXECUTED = NO
    DEPLOY_EXECUTED = NO

## 参照

- [SEC Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data): Fair Access、申告User-Agent、gzip/deflate。
- [SEC Webmaster FAQ](https://www.sec.gov/about/webmaster-frequently-asked-questions): 自動アクセス拒否・Access Denied問い合わせ案内。
- [SEC EDGAR API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces): data.sec.govのSubmissions / Companyfacts。
- [Undici DiagnosticsChannel](https://github.com/nodejs/undici/blob/main/docs/docs/api/DiagnosticsChannel.md): 実送信直前のヘッダー観測イベント。
