# Toyota最新有報の年度選択監査 / SEC問い合わせ準備

監査日: 2026-10-01（JST）。SECのライブ接続診断は再実行していません。

## 結論と原因

Toyota（7203 / E02144）の最新正式年度はFY2026、2025-04-01〜2026-03-31です。正式有価証券報告書は S100Y8NY、2026-06-10 15:33提出、docTypeCode=120です。

FY2026→FY2025の変化は提出書類選択の変更ではなく、最新有報を処理できなかった後に古い年次データを先頭として返したことが原因です。

1. 以前の実データレポート live-free-7203-report.json はFY2026で、取得日時は2026-10-01 04:02:59 JSTです。保存済みの公式XBRLもS100Y8NYからFY2026/FY2025を正規化できています。
2. SEC診断時の live-free-7203.JP-report.json はFY2025で、取得日時は2026-10-01 04:25:51 JSTです。providerUpdatedAtは2026-06-10のまま、issuesに「S100Y8NYのXBRLを安全に正規化できませんでした。数値は未取得です。」が記録されています。つまりS100Y8NYは選択・メタデータ照合されていました。
3. EdinetProvider.companyは最新有報の取得、ZIP展開、本文の一意選択、UTF-8復号、XBRL正規化を一つのtry/catchで囲みます。401/403/429以外の失敗はissuesへ変換して続行します。
4. blocked処理がFY2026を除外し、正常な旧有報S100VWVYから得たFY2025がannual[0]に残りました。buildReportはannual[0].endをmetadata.fiscalDateへ採用したため、FY2025表示になりました。
5. 以前のエラー記録は段階別の例外を保存していません。その失敗が通信タイムアウト、ZIP処理、本文選択、復号、正規化のどれだったかは遡って確定できません。「通信が原因」「EDINETが書類を変更した」「解析仕様が変わった」とは断定しません。今回の段階別ライブ監査はHTTP/ZIP/XBRLすべて成功しました。

半期報告書の年度メタデータと年次データの混同ではありません。現行処理はannualとhalf-yearを分離し、半期による年次ブロックの防止処理も既にあります。

## EDINET一次資料の確認

サーバー設定のEDINET_API_KEYを使用し、2025-06-18 / 2025-06-26 / 2025-11-13 / 2026-06-10 / 2026-06-24 / 2026-10-01の書類一覧API（type=2）をライブ再取得しました。すべてHTTP 200・metadata.status=200。キー・秘密URLを記録していません。

全提出日を再走査したわけではありません。既存公式索引は2025-06-01〜2026-10-01を連続してカバーしており、そのToyota/Kioxiaの金融報告書提出日と本日を再確認しました。取得後の新規提出・索引更新は従来の保守手順で反映します。

| 企業 | 書類ID | 書類種別 | periodStart | periodEnd（一覧メタデータ） | submitDateTime（JST） |
| --- | --- | --- | --- | --- | --- |
| Toyota | S100VWVY | 120 有価証券報告書 | 2024-04-01 | 2025-03-31 | 2025-06-18 15:30 |
| Toyota | S100WYZE | 160 半期報告書 | 2025-04-01 | 2026-03-31 | 2025-11-13 15:30 |
| Toyota | S100Y8NY | 120 有価証券報告書 | 2025-04-01 | 2026-03-31 | 2026-06-10 15:33 |
| Kioxia | S100W440 | 120 有価証券報告書 | 2024-04-01 | 2025-03-31 | 2025-06-26 11:04 |
| Kioxia | S100X3DB | 160 半期報告書 | 2025-04-01 | 2026-03-31 | 2025-11-13 15:34 |
| Kioxia | S100YJ18 | 120 有価証券報告書 | 2025-04-01 | 2026-03-31 | 2026-06-24 11:15 |

上記の金融報告書はxbrlFlag=1、withdrawalStatus=0、disclosureStatus=0、parentDocID=nullです。既存索引および今回再確認した一覧に、これらの年度の訂正有価証券報告書（130）・訂正半期報告書（170）はありません。訂正の挙動は独立したTEST DATAで検証しています。

同じ提出日には確認書（135）、内部統制報告書（235）、自己株券買付状況報告書（220）もありました。これらは連結年次財務の選択対象にしません。提出日時だけで「最も新しい書類」を選びません。

半期報告書の一覧periodEndは2026-03-31ですが、これは期を示すメタデータです。実際の半期財務の期末は既存パーサーがXBRL contextから確認する2025-09-30です。

ライブ取得した最新有報:
- S100Y8NY: ZIP 2,410,352 bytes、PublicDoc XBRL 9,166,837 bytes。FY2026売上50,684,952,000,000 JPYを既存パーサーで確認。公式文書内の比較FY2025は48,036,704,000,000 JPY。
- S100YJ18: ZIP 959,934 bytes、PublicDoc XBRL 4,605,072 bytes。FY2026売上2,337,628,000,000 JPYを既存パーサーで確認。
- いずれもPublicDoc本文は一意、ZIP整合性・連結提出者・期間・通貨を既存実装で検証しました。

## 最新正式年度の選択規則

1. 公式発行体対応（EDINET code / 証券コード）を照合し、更新済み索引と本日までの公式書類一覧を統合する。
2. 取下げ・非開示、未来のperiodEnd、未来の提出日時を除外する。
3. 書類種別120/130をannual、160/170をhalf-year、140/150をquarterlyとして分離する。半期の一覧periodEndが有報と一致しても同じ年次グループにしない。
4. annualではperiodEndの降順を最優先する。同じannual fiscal endの中ではsubmitDateTime降順で訂正版を含む最新提出を選ぶ。古い年度の訂正が後日提出されても、より新しい年度の有報を置き換えない。parentDocIDは一次資料として確認・保存するが、提出日時から年度を推測しない。
5. 選択した書類を提出日の公式一覧で再照合し、公開状態、発行体、証券コード、書類種別、期間を確認する。periodStart/periodEndを正規化・キャッシュ識別にも使用する。
6. 実財務の年度・半期・四半期は、既存XBRLパーサーによる連結contextの開始日・終了日と期間長で確認する。提出日を決算期末として使用しない。
7. 訂正書類を選択した年度でXBRLがない、本文を取得できない、同じ書類から当年度contextを得られない場合、訂正前の数値で代用しない。
8. 最新正式有報の年度が有効なannual[0]と一致しない場合、旧年度を「最新」の分析として返さず、書類ID・最新期末を示すDATA_PROVIDER_ERRORで停止する。自動retryを追加しない。全年度が未取得の場合のUNKNOWN/データなし契約は維持する。最新年度自体が確認できていて個別項目が欠ける場合は、従来どおり部分データ/UNKNOWNを表示する。

本監査の対象であるToyota/Kioxiaの実書類には、同一年度・同一提出時刻の競合する訂正はありません。存在しない訂正やその順序を推測しません。

## 実装の最小修正

本タスクの本番変更はserver/stock-analysis/edinet.tsの選択後チェックだけです。selectedから最新120/130を取得し、正規化後のannual[0]が別年度になった場合にエラーとするチェックを追加しました。

既存の書類選択順、XBRLパーサー、ZIP reader、PrimaryHttp、EDINET公式索引、発行体一覧、SEC実装、API関数、分析engineは変更していません。最新書類の一時的な不取得を、旧年度への表示変更に変換しなくなりました。取得自体の成功を保証する変更ではありません。

## 検証

- 既存76件と新規選択回帰5件、計81件のローカル単体・契約テスト: PASS。
- 後日提出された旧年度訂正、半期と有報の同一期末、同年度訂正優先、XBRLなし訂正、HTTP失敗、壊れたZIP、当年度context欠落を検証。
- 最新年度HTTP失敗時に自動retryせず停止し、別の明示的な呼び出しで正常取得した時のみFY2026へ復帰することを検証。
- 個別項目欠落はUNKNOWNとして最新年度を維持することを検証。
- 7203.JP EDINET実データUI E2E: PASS、fiscalDate=2026-03-31、Revenue出典=S100Y8NY。
- 285A.JP EDINET実データUI E2E: PASS、fiscalDate=2026-03-31、Revenue出典=S100YJ18。
- 両銘柄で12セクション、FACT/CALCULATION、Limited Valuation、375px表示、ブラウザーエラーなしを確認。
- 単独ライブ文書監査と、新しいAPI/browserセッションのE2Eの両方で最新FY2026を確認。古い保存データによるライブ代用はしていません。
- npm run typecheck: PASS。
- npm run build: PASS、34ページの生成・static export完了。
- Web API ESM関数バンドル: PASS、新規実行依存/Node専用import/テストimportなし。
- 保護対象のパーサー・通信・索引とSEC下書きのSHA-256を監査前後で比較。
- commit / push / deployを実行していません。

今回の一次資料・回帰出力はGit除外ディレクトリ.stock-test-output内のtoyota-official-filing-audit.json、latest-filing-edinet-regression.json、latest-filing-7203.JP-report.json、latest-filing-285A.JP-report.jsonに保存しました。SEC診断時のFY2025レポートは監査証拠として保持しています。

## SEC問い合わせ準備

SEC_WEBMASTER_REQUEST_DRAFT.txtは内容を保持しました。設定済み公開連絡先、アプリ名、403発生日時、公式endpoint、エラー要約を含むOwner向け下書きです。API keyや秘密情報は含みません。公開IPはまだ提供されていないため未確認の入力欄を維持しています。

公開IPをOwnerが提供したらその値を下書きへ反映する手順です。SECへの送信はOwner承認待ちで、本タスクでは実行していません。SEC接続診断、回避策、Provider追加は実行していません。

## 受入条件

    TOYOTA_LATEST_ANNUAL_SELECTION_EXPLAINED = YES
    TOYOTA_LATEST_ANNUAL_SELECTION_STABLE = YES
    7203_EDINET_E2E = PASS
    285A_EDINET_E2E = PASS
    SEC_CONTACT_DRAFT_READY = YES
    SEC_SENT = NO
    BUILD = PASS
    TYPESCRIPT = PASS
    COMMIT = NO
    PUSH = NO
    DEPLOY = NO

STABLEは「正式最新年度を確認できた時はFY2026、確認できない時は旧年度への無表示切替をしない」という意味です。外部APIの可用性や、今後の新規提出の不存在を保証するものではありません。

## 一次資料と公式案内

- [EDINET API仕様書 Version 2](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf): 書類一覧の項目、書類種別、取下げ・公開状態。
- [Toyota FY2026有価証券報告書 S100Y8NY](https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100Y8NY)
- [Toyota FY2025有価証券報告書 S100VWVY](https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100VWVY)
- [Toyota 半期報告書 S100WYZE](https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100WYZE)
- [Kioxia FY2026有価証券報告書 S100YJ18](https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100YJ18)
- [SEC Webmaster FAQ](https://www.sec.gov/about/webmaster-frequently-asked-questions): アクセス拒否の問い合わせと公開IPの提供。
