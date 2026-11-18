import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { Callout, ComparisonTable } from "@/components/Diagram";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "基礎知識",
  description:
    "初心者向けFXトレード解説BOOK。FXの仕組み、単位とコスト、証拠金とレバレッジ、注文、チャート、移動平均線、メンタル、リスクと実務知識を用語集まで章ごとに整理します。",
  path: "/fx-basics",
});

/* ---------- small building blocks ---------- */

function ChapterSection({
  id,
  no,
  title,
  sub,
  points,
  children,
}: {
  id: string;
  no: string;
  title: string;
  sub: string;
  points: string[];
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="container-page scroll-mt-24 border-t border-border py-14 sm:py-16">
      <div
        className="rounded-card px-6 py-6 sm:px-8"
        style={{ background: "linear-gradient(120deg, #075985 0%, #0284c7 55%, #0ea5e9 100%)" }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-100">Chapter {no}</p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight text-white">
          第{no}章 {title}
        </h2>
        <p className="mt-2 text-base font-semibold text-sky-50">{sub}</p>
      </div>
      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">この章でわかること</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {points.map((p) => (
            <li key={p} className="flex gap-2 text-sm leading-6 text-text-secondary">
              <span aria-hidden="true" className="font-bold text-primary">✓</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-10 space-y-10">{children}</div>
    </section>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-xl font-bold leading-snug text-text-primary">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-8 text-text-secondary sm:text-[15px]">{children}</p>;
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-7 text-text-secondary sm:text-[15px]">
          <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-7 text-text-secondary sm:text-[15px]">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary font-display text-xs font-black text-primary">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Quote({ children, cite }: { children: React.ReactNode; cite?: string }) {
  return (
    <blockquote className="rounded-card border border-border border-l-4 border-l-primary bg-surface p-5">
      <p className="text-[15px] font-semibold leading-8 text-text-primary">{children}</p>
      {cite ? <cite className="mt-2 block text-xs not-italic text-text-secondary">── {cite}</cite> : null}
    </blockquote>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-primary/50 bg-[rgba(59,130,246,0.08)] px-5 py-4 text-center">
      <p className="font-display text-base font-bold text-text-primary sm:text-lg">{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-6 text-text-secondary">※{children}</p>;
}

function Summary({ items }: { items: string[] }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 sm:p-6">
      <p className="font-display text-sm font-black uppercase tracking-widest text-primary">この章のまとめ</p>
      <ol className="mt-4 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-7 text-text-secondary sm:text-[15px]">
            <span className="font-display font-black text-text-primary">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Quiz({ items }: { items: { q: string; options: string; answer: string }[] }) {
  return (
    <div className="rounded-card border border-border p-5 sm:p-6">
      <p className="font-display text-sm font-black uppercase tracking-widest text-primary">理解度チェック</p>
      <div className="mt-4 space-y-5">
        {items.map((item, i) => (
          <div key={i}>
            <p className="text-sm font-bold leading-7 text-text-primary sm:text-[15px]">
              Q{i + 1} {item.q}
            </p>
            <p className="mt-1 text-sm leading-7 text-text-secondary">{item.options}</p>
            <p className="mt-2 rounded-button bg-surface px-4 py-2.5 text-sm leading-7 text-text-secondary">
              <span className="font-bold text-text-primary">答え：</span>
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const TOC_GROUPS: { label: string; chapters: { id: string; label: string }[] }[] = [
  {
    label: "仕組みを知る",
    chapters: [
      { id: "chapter-1", label: "第1章 FXってそもそも何？" },
      { id: "chapter-2", label: "第2章 取引の単位とコスト" },
      { id: "chapter-3", label: "第3章 証拠金とレバレッジ" },
      { id: "chapter-4", label: "第4章 注文の出し方" },
    ],
  },
  {
    label: "チャートを読む",
    chapters: [
      { id: "chapter-5", label: "第5章 チャートの読み方" },
      { id: "chapter-6", label: "第6章 移動平均線" },
    ],
  },
  {
    label: "守って続ける",
    chapters: [
      { id: "chapter-7", label: "第7章 メンタル" },
      { id: "chapter-8", label: "第8章 リスクと始める前の実務知識" },
    ],
  },
  {
    label: "巻末付録",
    chapters: [{ id: "glossary", label: "用語集（50音順）" }],
  },
];

export default function FxBasicsPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "基礎知識", path: "/fx-basics" }]} />

      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Basics — Step-by-Step Trading Textbook"
          title="基礎知識"
          description="初心者向けFXトレード解説BOOK。FXの仕組みから、チャートの読み方、メンタル、リスクと始める前の実務知識までを、章ごとに細分化して整理しました。旧「資金管理」ページの内容は、本ページの第8章に統合しています。"
        />
        <div className="mt-6">
          <Callout tone="primary" title="この本のゴール">
            「どこまで動くかを測り、負けを小さく保ち、続けられる」状態になること。1章ずつ、順番に読むのがいちばんの近道です。
          </Callout>
        </div>
      </section>

      <section className="container-page mt-12">
        <h2 className="font-display text-xl font-bold text-text-primary">最初にお伝えしておくこと</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="font-display text-base font-bold text-text-primary">売買の推奨ではない</h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              特定の通貨・タイミングでの売買をすすめるものではなく、投資助言ではありません。
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-display text-base font-bold text-text-primary">損失の可能性がある</h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              FXは元本を失うリスクがあります。必ず余裕資金の範囲で、ご自身の判断と責任で行ってください。
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-display text-base font-bold text-text-primary">結果は個人のもの</h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              出てくる事例や数字は、その人個人の条件での結果です。将来の成果を保証しません。
            </p>
          </div>
        </div>
        <div className="card mt-5 p-6">
          <h3 className="font-display text-base font-bold text-text-primary">この本の読み方（4つのルール）</h3>
          <div className="mt-4">
            <Steps
              items={[
                <><strong className="text-text-primary">1章ずつ、順番に</strong>：あとの章は前の章の言葉を使います。飛ばさずに前から読むのがいちばんの近道です。</>,
                <><strong className="text-text-primary">図を見てから文字</strong>：大事なことはすべて図にしました。図を見て「何が起きているか」を先につかみます。</>,
                <><strong className="text-text-primary">章末のチェックで確認</strong>：章の最後に3問のクイズがあります。答えられなければ、その章に戻ればOKです。</>,
                <><strong className="text-text-primary">分からない言葉は用語集</strong>：最後に、出てくる言葉を50音順でまとめました。何度でも戻ってください。</>,
              ]}
            />
          </div>
        </div>
      </section>

      <section className="container-page mt-12">
        <h2 className="font-display text-xl font-bold text-[#ef4444]">目次</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TOC_GROUPS.map((group) => (
            <div key={group.label} className="card p-5">
              <p className="font-display text-sm font-black uppercase tracking-widest text-primary">{group.label}</p>
              <ul className="mt-4 space-y-2.5">
                {group.chapters.map((ch) => (
                  <li key={ch.id}>
                    <a href={`#${ch.id}`} className="text-sm leading-6 text-text-secondary hover:text-text-primary">
                      {ch.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <ChapterSection
        id="chapter-1"
        no="1"
        title="FXってそもそも何？"
        sub="FXは、通貨を交換する取引"
        points={["FXという言葉の意味", "円高・円安とは何か", "「買い」でも「売り」でも利益が出る理由", "株との違いと、考え方"]}
      >
        <Block>
          <Sub>FX＝外国為替証拠金取引</Sub>
          <P>長い名前ですが、3つに分けると意味はシンプルです。</P>
          <Bullets
            items={[
              <><strong className="text-text-primary">外国為替</strong>：円とドルのように、違う国のお金を交換すること。</>,
              <><strong className="text-text-primary">証拠金</strong>：取引の担保として、口座に預けておくお金（第3章）。</>,
              <><strong className="text-text-primary">取引</strong>：交換したお金をまた戻すことで、その差額が損益になる。</>,
            ]}
          />
          <P>FXは「お金を担保に預けて、通貨の交換をくり返す取引」です。</P>
        </Block>

        <Block>
          <Sub>通貨を交換して、レートの差で利益を出す</Sub>
          <Steps
            items={[
              "円をドルに替える：1ドル＝120円のとき 12万円 → 1,000ドル",
              "レートが動く：1ドル＝130円に（ドルの価値が上がった）",
              "ドルを円に戻す：1,000ドル → 13万円、差額＋1万円",
            ]}
          />
          <P>交換したときと戻したときの「レートの差」が、利益や損失になります。</P>
          <Note>例は仕組みの説明用の数字です。実際には取引コスト（第2章）がかかります。</Note>
        </Block>

        <Block>
          <Sub>円高・円安 ── 数字が小さくなるのに「円高」</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">円高</strong>：1ドル＝150円 → 140円。1ドルを買うのに必要な円が減った。円の価値が上がった（ドルが安くなった）。</>,
              <><strong className="text-text-primary">円安</strong>：1ドル＝150円 → 160円。1ドルを買うのに必要な円が増えた。円の価値が下がった（ドルが高くなった）。</>,
            ]}
          />
          <P>「1ドルを手に入れるのに、円がいくら必要か」で考えると迷いません。</P>
        </Block>

        <Block>
          <Sub>「買い」から入る ── 上がると利益（ロング）</Sub>
          <P>「これから上がる」と考えたときに、先に買う。上がったところで売って決済すれば、その差が利益。買ったあとに下がれば、その差は損失になります。</P>
          <Sub>「売り」から入る ── 下がると利益（ショート）</Sub>
          <P>FXは持っていない通貨を先に売れる。下がったところで買い戻せば、その差が利益。「下がる相場」でも利益を狙えるのが、FXの大きな特徴です。</P>
          <ComparisonTable
            headers={["入り方", "値段が上がったら", "値段が下がったら"]}
            rows={[
              ["買い（ロング）", "利益", "損失"],
              ["売り（ショート）", "損失", "利益"],
            ]}
          />
          <P>どちらから入っても、「予想と逆に動いたら損失」は同じ。だから損失の上限を先に決めます（第8章）。</P>
        </Block>

        <Block>
          <Sub>平日はほぼ24時間、世界のどこかで動いている</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">東京</strong>：日本時間の朝〜夕方。値動きは比較的おだやか。</>,
              <><strong className="text-text-primary">ロンドン</strong>：夕方〜深夜。動きが出はじめる。</>,
              <><strong className="text-text-primary">ニューヨーク</strong>：夜〜早朝。一日でいちばん動きやすい。</>,
            ]}
          />
          <P>「いつでもできる」は「いつでも見なければ」にもなる。見る時間を決めるのが技術です。</P>
          <Note>市場の時間は目安。夏時間・冬時間で1時間ずれます。土日は基本的に休み（仮想通貨など一部を除く）。</Note>
        </Block>

        <Block>
          <Sub>株との違い</Sub>
          <ComparisonTable
            headers={["比較項目", "FX", "株式（現物）"]}
            rows={[
              ["取引できる時間", "平日ほぼ24時間", "取引所が開いている時間"],
              ["売りから入る", "できる", "基本はできない（信用取引は別）"],
              ["レバレッジ", "かけられる（国内は最大25倍）", "かけない（信用取引は約3倍まで）"],
              ["値動きの理由", "国どうしのお金の価値・金利・ニュース", "会社の業績・ニュース"],
            ]}
          />
        </Block>

        <Block>
          <Sub>考え方 ── FXは「投資」ではなく「投機」</Sub>
          <Quote cite="ノート「FXとは何か？」">FXは投資ではなく投機です。そして、投機には投機の正しいやり方があります</Quote>
          <Bullets
            items={[
              <><strong className="text-text-primary">投資</strong>：長い時間をかけて、ゆっくり増やす。株の長期保有など。</>,
              <><strong className="text-text-primary">投機（FX）</strong>：短い時間の値動き（波）を取りにいく。だから考え方も道具も、投資とは別物。</>,
            ]}
          />
          <P>株の常識（分散・長期・放っておく）をそのまま持ち込まない。</P>
        </Block>

        <Block>
          <Sub>FXは「上か下か」ではなく「どこまで」を測るゲーム</Sub>
          <P>よくある思い込み：上がるか下がるかを当てられれば、勝てるはず。</P>
          <Quote cite="波動論 ep3">実際にFXで稼ぐ上では、どちらかと言うと“距離当てゲーム”に近い</Quote>
          <P>「どこまで行くか」「どこで止めるか」を測れる人が勝つ。この本はその測り方の本です。</P>
        </Block>

        <Block>
          <Sub>なぜ多くの人が負けるのか ── 5つの構造</Sub>
          <Steps
            items={[
              "上か下かを当てにいく → 当てるのをやめて「どこまで」を測る",
              "手法を「探して」いる → 1つの基準を100回検証した人はほとんどいない",
              "後付けの道具に未来を聞く → インジケーターは値段が動いた「結果」（第6章）",
              "守りが存在しない → いくら賭けるかを決めていない（第8章）",
              "みんなと同じ場所に損切りを置く → 「2〜3回試されたラインは、3〜4回目で抜けやすい」",
            ]}
          />
          <P>5つとも、この本の中に「答えの章」があります。</P>
        </Block>

        <Summary
          items={[
            "FX＝通貨を交換する取引。レートの差が損益になる",
            "円高・円安：1ドルを手に入れるのに必要な円で考える",
            "買いでも売りでも利益が狙える。その分、逆に動けば損失",
            "FXは投機。当てるより「どこまで」を測る",
          ]}
        />
        <Quiz
          items={[
            { q: "1ドル＝150円が140円になった。これは？", options: "A：円安　B：円高　C：どちらでもない", answer: "B ── 1ドルを手に入れるのに必要な円が減った＝円の価値が上がった。" },
            { q: "「売り」から入って利益が出るのは？", options: "A：値段が上がったとき　B：値段が下がったとき　C：動かないとき", answer: "B ── 先に売って、安くなってから買い戻すと、その差が利益になる。" },
            { q: "FXをたとえた言葉は？", options: "A：コイントス　B：長期投資　C：距離当てゲーム", answer: "C ── 上か下かより「どこまで動くか」を測ることが大事、という意味。" },
          ]}
        />
      </ChapterSection>

      <ChapterSection
        id="chapter-2"
        no="2"
        title="取引の単位とコスト"
        sub="通貨ペア・pips・ロットを覚える"
        points={["通貨ペアとレートの読み方", "値動きの単位「pips」", "取引量の単位「ロット」", "損益の計算と、3つのコスト"]}
      >
        <Block>
          <Sub>通貨ペアの読み方 ── 「USD/JPY」は「1ドル＝何円」</Sub>
          <Formula>USD / JPY 150.00 ＝ 1ドル＝150円</Formula>
          <Bullets
            items={[
              <><strong className="text-text-primary">左</strong>：基準になる通貨。USD（米ドル）。この通貨「1単位」が…</>,
              <><strong className="text-text-primary">右</strong>：値段を表す通貨。JPY（円）で、いくらか。</>,
            ]}
          />
          <P>EUR/USD 1.1000 なら「1ユーロ＝1.1ドル」。左の通貨を買うか売るか、と考えます。</P>
        </Block>

        <Block>
          <Sub>よく取引される銘柄</Sub>
          <ComparisonTable
            headers={["銘柄", "表記", "特徴"]}
            rows={[
              ["ドル円", "USD/JPY", "日本人にいちばん身近。情報が多く、最初の練習に向く"],
              ["ユーロドル", "EUR/USD", "世界でいちばん取引量が多い通貨ペア"],
              ["ポンド円", "GBP/JPY", "値動きが大きい。慣れてから"],
              ["ゴールド", "XAU/USD", "値動きが大きい。ライブでよく扱う"],
              ["ビットコイン", "BTC/USD", "業者によっては土日も動く。値動きが非常に大きい"],
            ]}
          />
        </Block>

        <Block>
          <Sub>買値と売値 ── 2つの値段がある</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">売値（Bid）149.997</strong>：あなたが「売る」ときの値段</>,
              <><strong className="text-text-primary">買値（Ask）150.000</strong>：あなたが「買う」ときの値段</>,
            ]}
          />
          <P>買値と売値の差＝スプレッド。この例では0.003円（0.3pips）です。</P>
          <Sub>スプレッドは「実質の手数料」</Sub>
          <Steps
            items={[
              "買値150.000で買う",
              "すぐ売ると…売値149.997でしか売れない",
              "最初からスプレッド分（0.3pips）の損からスタート",
            ]}
          />
          <P>何回も出入りするほど、スプレッドの負担は積み重なります。</P>
          <Note>経済指標の発表時や早朝などは、スプレッドが一時的に大きく広がることがあります。</Note>
        </Block>

        <Block>
          <Sub>値動きの単位「pips（ピップス）」</Sub>
          <ComparisonTable
            headers={["銘柄の種類", "1pipsの大きさ", "例"]}
            rows={[
              ["円が付く通貨ペア（ドル円など）", "0.01円（1銭）", "150.00 → 150.50 は 50pips"],
              ["ドルどうし（ユーロドルなど）", "0.0001ドル", "1.1000 → 1.1050 は 50pips"],
              ["ゴールド・ビットコインなど", "業者ごとに定義が違う", "取引前に必ず確認"],
            ]}
          />
          <P>pipsは「通貨が違っても同じものさしで値動きを測る」ための単位です。</P>
        </Block>

        <Block>
          <Sub>取引量の単位「ロット」</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">国内の業者</strong>：1ロット＝1万通貨が多い（1,000通貨の業者もある）</>,
              <><strong className="text-text-primary">海外の業者</strong>：1ロット＝10万通貨が多い。0.01ロット＝1,000通貨</>,
            ]}
          />
          <P>同じ「1ロット」でも業者によって10倍違う。必ず「何通貨か」で考えます。</P>
          <Note>ドル円の1万通貨なら、1pips動くと100円の損益（0.01円×1万）。</Note>
        </Block>

        <Block>
          <Sub>損益の計算は、この式だけ</Sub>
          <Formula>損益 ＝ 動いた値幅（pips）× 1pipsの価値 × 取引量</Formula>
          <Bullets
            items={[
              "1pipsの価値（ドル円）：1万通貨で100円／10万通貨で1,000円",
              "考える順番：「何pips動いたら、いくら増減するか」を入る前に計算しておく",
            ]}
          />
          <Sub>計算してみる① ── ドル円</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">利益の例</strong>：1万通貨を150.00で買い → 150.50で売って決済（50pips上昇）→ 50pips × 100円 ＝ ＋5,000円</>,
              <><strong className="text-text-primary">損失の例</strong>：1万通貨を150.00で買い → 149.80で損切り（20pips下落）→ 20pips × 100円 ＝ −2,000円</>,
            ]}
          />
          <Sub>計算してみる② ── ユーロドル</Sub>
          <Steps
            items={[
              "1万通貨を1.1000で買い",
              "50pips上がった、1.1050で決済",
              "ドルで利益：0.0050ドル × 1万 ＝ 50ドル",
              "円に直す：1ドル150円なら ＝ 7,500円",
            ]}
          />
          <P>ドルどうしの通貨ペアは、利益がドルで出る。円に直すとき、ドル円のレートを使います。</P>
        </Block>

        <Block>
          <Sub>取引にかかる3つのコスト</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">スプレッド</strong>：買値と売値の差。取引のたびにかかる</>,
              <><strong className="text-text-primary">手数料</strong>：業者によって、1回ごとにかかる場合がある</>,
              <><strong className="text-text-primary">スリッページ</strong>：注文した値段と、実際に約定した値段のずれ。急な値動きで起きやすい</>,
            ]}
          />
          <Quote cite="ノート 動画②">スプレッドなし、手数料ゼロはありえない</Quote>
        </Block>

        <Block>
          <Sub>スワップ ── 持ち越すと、金利の差を受け取る・支払う</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">受け取る場合</strong>：金利が高い通貨を買って、日をまたいで持つと、金利差を受け取れることがある</>,
              <><strong className="text-text-primary">支払う場合</strong>：逆に、金利が高い通貨を売って持ち越すと、支払いになる</>,
            ]}
          />
          <P>デイトレードは「翌日に持ち越さない」が基本。スワップはおまけ程度に考えます。</P>
          <Note>週に1回、3日分がまとめて付く日があります（業者によって曜日が違います）。</Note>
        </Block>

        <Summary
          items={[
            "通貨ペアは「左の通貨1つが、右の通貨でいくら」。USD/JPY 150.00＝1ドル150円",
            "pips＝値動きの単位。ドル円は1pips＝0.01円",
            "ロット＝取引量の単位。国内と海外で10倍違う。必ず通貨数で考える",
            "損益＝pips × 1pipsの価値 × 量。スプレッド・手数料・スリッページもかかる",
          ]}
        />
        <Quiz
          items={[
            { q: "ドル円が150.00から150.30になった。何pips？", options: "A：3pips　B：30pips　C：300pips", answer: "B ── 円が付くペアは0.01円＝1pips。0.30円の値動きは30pips。" },
            { q: "ドル円1万通貨で20pips逆に動いた。損失は？", options: "A：200円　B：2,000円　C：2万円", answer: "B ── 1万通貨なら1pips＝100円。20pips × 100円＝2,000円。" },
            { q: "買値と売値の差を何という？", options: "A：スワップ　B：スプレッド　C：スリッページ", answer: "B ── スプレッドは実質の手数料。取引のたびにかかる。" },
          ]}
        />
      </ChapterSection>

      <ChapterSection
        id="chapter-3"
        no="3"
        title="証拠金とレバレッジ"
        sub="少ないお金で、大きく動かす仕組み"
        points={["証拠金とレバレッジの意味", "必要な証拠金の計算", "証拠金維持率とロスカット", "「少額でこそ強い」と言う理由"]}
      >
        <Block>
          <Sub>証拠金 ── 取引のために預ける「担保」</Sub>
          <P>口座に入れておくお金。このお金を担保に、それより大きな金額の取引ができる。</P>
          <Bullets
            items={[
              "最大のリスク：借金のように見えるが、基本的に失うのは口座の証拠金まで（相場の急変時は例外あり。第8章で説明）。",
            ]}
          />
        </Block>

        <Block>
          <Sub>レバレッジ ── 証拠金の何倍まで動かせるか</Sub>
          <Bullets
            items={[
              "証拠金 10万円 × レバレッジ25倍（国内の上限）→ 250万円分",
              "証拠金 10万円 × レバレッジ100倍（海外の例）→ 1,000万円分",
            ]}
          />
          <P>少ないお金で大きく動かせる。その分、損も同じ倍率で大きくなります。</P>
        </Block>

        <Block>
          <Sub>必要な証拠金を計算する</Sub>
          <Steps
            items={[
              "取引額を出す：1ドル150円 × 1万通貨 ＝ 150万円分",
              "レバレッジで割る：150万円 ÷ 25倍",
              "必要な証拠金：＝ 6万円",
            ]}
          />
          <P>「6万円あればドル円1万通貨が持てる」。ただし、ぎりぎりで持つとすぐロスカットになります。</P>
        </Block>

        <Block>
          <Sub>本当のレバレッジは「ロット」で決まる</Sub>
          <Formula>実際のレバレッジ ＝ 取引額 ÷ 口座のお金</Formula>
          <Bullets
            items={[
              "例：口座10万円で、ドル円1万通貨（150万円分）を持つ → 実際のレバレッジは15倍",
              "大事なこと：「何倍の口座か」より「何通貨持つか」で、リスクは決まる。ロットを決めるのは自分",
            ]}
          />
        </Block>

        <Block>
          <Sub>レバレッジは「もろ刃の剣」</Sub>
          <P>値段が1%動いたとき、口座はどれだけ増減するか。</P>
          <ComparisonTable
            headers={["レバレッジ", "値段が1%動いたときの口座の増減"]}
            rows={[
              ["1倍", "±1%"],
              ["10倍", "±10%"],
              ["25倍", "±25%"],
            ]}
          />
          <P>レバレッジを上げるほど、1回の値動きで口座が大きく増え、大きく減ります。</P>
        </Block>

        <Block>
          <Sub>考え方 ── FXは少額でこそ強い</Sub>
          <Quote cite="ノート「レバレッジとは何か？」">FXは少額でこそ、その優位性が発揮される</Quote>
          <Bullets
            items={[
              <><strong className="text-text-primary">なぜ少額？</strong>：証拠金が小さいほど、レバレッジの優位性を活かしやすい。大きな資金は注文が通りにくくなることもある</>,
              <><strong className="text-text-primary">考え方</strong>：「1年間で100万円を10分割、10万円×10回」。技術を育てる前提で、何度もやり直せる形にする（第8章）</>,
            ]}
          />
        </Block>

        <Block>
          <Sub>証拠金維持率 ── 口座の「余裕」を示す数字</Sub>
          <Formula>証拠金維持率 ＝ 口座の残り（有効証拠金）÷ 必要証拠金 × 100</Formula>
          <P>例：有効証拠金10万円、必要証拠金6万円 → 約167%。含み損が増えるほど有効証拠金が減り、維持率が下がっていきます。</P>
          <Sub>マージンコールとロスカット</Sub>
          <P>維持率の目安の流れ：100%＝余裕がある → マージンコール（例：50%前後）→ ロスカット（例：20%前後）。</P>
          <Bullets
            items={[
              <><strong className="text-text-primary">マージンコール</strong>：維持率が下がってきたときの「警告」。入金かポジションを減らすよう求められる</>,
              <><strong className="text-text-primary">ロスカット</strong>：さらに下がると、業者が強制的に決済する。意図しない場所で損失が確定する</>,
            ]}
          />
          <Note>警告や強制決済が起きる水準は業者ごとに違います。口座を作るときに必ず確認してください。</Note>
        </Block>

        <Block>
          <Sub>ロスカットに任せない。損切りは自分で置く</Sub>
          <P>よくある思い込み：ロスカットがあるから、それ以上は減らないし大丈夫。</P>
          <Quote cite="ノート 動画⑧">命綱としてストップ（損切り注文）は必ず置く</Quote>
          <P>ロスカットは「口座がほぼ空になる直前の安全装置」。自分の損切りとは別物です。</P>
        </Block>

        <Block>
          <Sub>国内の業者と海外の業者の違い（一般論）</Sub>
          <ComparisonTable
            headers={["比較項目", "国内の業者", "海外の業者"]}
            rows={[
              ["レバレッジの上限", "個人は25倍まで", "業者により数百倍以上もある"],
              ["急変で口座がマイナスに", "不足分を請求されることがある", "0に戻す仕組み（ゼロカット）の業者が多い"],
              ["お金の保全", "分けて管理する決まりがある", "業者・国によって違う"],
              ["税金", "申告分離課税（第8章）", "総合課税（第8章）"],
            ]}
          />
          <Note>一般的な違いの整理です。特定の業者をすすめるものではありません。条件は各社の最新情報で確認してください。</Note>
        </Block>

        <Summary
          items={[
            "証拠金＝取引の担保。口座に預けるお金",
            "レバレッジ＝証拠金の何倍動かせるか。利益も損失も同じ倍率で大きくなる",
            "本当のリスクは「ロット」で決まる。実際のレバレッジ＝取引額÷口座のお金",
            "維持率が下がるとロスカット。それに頼らず、損切りは自分で置く",
          ]}
        />
        <Quiz
          items={[
            { q: "1ドル150円で1万通貨。レバレッジ25倍なら必要証拠金は？", options: "A：6,000円　B：6万円　C：60万円", answer: "B ── 150万円分 ÷ 25倍 ＝ 6万円。" },
            { q: "口座10万円で150万円分を持つと、実際のレバレッジは？", options: "A：1.5倍　B：15倍　C：25倍", answer: "B ── 150万円 ÷ 10万円 ＝ 15倍。" },
            { q: "ロスカットとは？", options: "A：自分で置く損切り　B：業者による強制決済　C：利益の確定", answer: "B ── 維持率が一定を下回ると業者が強制決済する。自分の損切りとは別物。" },
          ]}
        />
      </ChapterSection>

      <ChapterSection
        id="chapter-4"
        no="4"
        title="注文の出し方"
        sub="入る前に、出口まで決める"
        points={["基本の3つの注文", "指値と逆指値の違い", "損切りを「先に」置く理由", "注文前のチェック"]}
      >
        <Block>
          <Sub>基本の注文は3つ</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">成行（なりゆき）</strong>：今の値段ですぐに売買する</>,
              <><strong className="text-text-primary">指値（さしね）</strong>：「今より有利な値段になったら」売買する予約</>,
              <><strong className="text-text-primary">逆指値（ぎゃくさしね）</strong>：「今より不利な値段になったら」売買する予約。損切りに使う</>,
            ]}
          />
          <P>指値と逆指値は、画面を見ていなくても自動で動いてくれる「予約」です。</P>
        </Block>

        <Block>
          <Sub>指値と逆指値 ── 今の値段の上か下か</Sub>
          <P>今の値段を基準に：</P>
          <Bullets
            items={[
              <><strong className="text-text-primary">上側</strong>：逆指値の買い（上がったら買う）／指値の売り（高くなったら売る）</>,
              <><strong className="text-text-primary">下側</strong>：指値の買い（安くなったら買う）／逆指値の売り（下がったら売る）</>,
            ]}
          />
          <P>覚え方：指値＝自分に「有利」な方向で待つ。逆指値＝「不利」な方向で発動する。損切りは逆指値：買いの損切りは「下がったら売る」逆指値。</P>
        </Block>

        <Block>
          <Sub>損切りは、入ったその瞬間に置く</Sub>
          <Quote cite="ノート 動画⑧">相場というのはストップを刈り上げてから、その方向にいく習性がある。命綱としてストップは必ず置く</Quote>
          <Bullets
            items={[
              <><strong className="text-text-primary">置かないと</strong>：含み損を見ながら「戻るかも」と待ち、損が大きくなる（第7章）</>,
              <><strong className="text-text-primary">置いておくと</strong>：想定した金額以上は減らない。感情が入る前に決着する</>,
            ]}
          />
        </Block>

        <Block>
          <Sub>出口まで一度に予約する ── IFD・OCO・IFO</Sub>
          <ComparisonTable
            headers={["注文", "仕組み", "使いどころ"]}
            rows={[
              ["IFD", "「この値段で入る」→ 入ったら「この値段で決済」を予約", "入口と出口を1回で予約"],
              ["OCO", "利食いと損切り、2つの決済を予約。片方が成立したらもう片方は消える", "ポジションを持ったあと"],
              ["IFO", "IFD＋OCO。入口・利食い・損切りを全部まとめて予約", "入る前に出口まで決める"],
            ]}
          />
          <P>「入る前に、利食いと損切りまで決める」。これがトレードの基本形です。</P>
        </Block>

        <Block>
          <Sub>取引画面（MT5）で見る場所</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">気配値（銘柄の一覧）</strong>：通貨ペアごとの買値・売値</>,
              <><strong className="text-text-primary">チャート</strong>：値動きのグラフ。第5章で読み方を学ぶ</>,
              <><strong className="text-text-primary">注文画面</strong>：ロット・方向・損切り・利食いを入れる</>,
              <><strong className="text-text-primary">ポジション一覧</strong>：持っている取引と、今の損益</>,
            ]}
          />
          <Note>画面の配置はソフトや業者で異なります。講座では動画で操作を説明しています。</Note>
        </Block>

        <Block>
          <Sub>注文の前に、5つを声に出して確認</Sub>
          <Steps
            items={[
              "通貨ペア：取引したい銘柄か",
              "方向：買いか売りか",
              "ロット：桁を間違えていないか（第8章で計算）",
              "損切り：逆指値が入っているか",
              "利食い：目標の値段が入っているか",
            ]}
          />
          <Note>違う銘柄・違う方向・桁違いのロットで注文してしまったら、気づいた時点ですぐ決済します。</Note>
        </Block>

        <Summary
          items={[
            "成行・指値・逆指値：指値＝有利な値段で待つ／逆指値＝不利な値段で発動",
            "損切りは逆指値で、入った瞬間に置く。「命綱」。ロスカットとは別物",
            "IFOで入口と出口を一度に。入る前に利食いと損切りまで決める",
            "注文前に5つを確認：銘柄・方向・ロット・損切り・利食い",
          ]}
        />
      </ChapterSection>

      <ChapterSection
        id="chapter-5"
        no="5"
        title="チャートの読み方"
        sub="ローソク足と流れを読む"
        points={["ローソク足1本の読み方", "時間足と、複数の時間足の見方", "トレンドとレンジ、ダウ理論", "サポート・レジスタンスと「強い形・弱い形」"]}
      >
        <Block>
          <Sub>チャート ── 縦が値段、横が時間</Sub>
          <P>チャートは「過去から今までの値段の記録」。縦軸が価格（上ほど高い）、横軸が時間（右ほど新しい）で、右端がいちばん新しい「今の値段」です。</P>
          <Sub>ローソク足 ── 1本に4つの値段が入っている</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">4つの値段</strong>：高値（一番高い値段）／安値（一番安い値段）／始値（始まりの値段）／終値（終わりの値段）</>,
              <><strong className="text-text-primary">実体とヒゲ</strong>：始値と終値の間が「実体」。上下の細い線が「ヒゲ」</>,
              <><strong className="text-text-primary">陽線と陰線</strong>：終値が始値より上なら陽線（上がった）、下なら陰線（下がった）</>,
            ]}
          />
        </Block>

        <Block>
          <Sub>ヒゲと実体で「力関係」を読む</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">上ヒゲが長い</strong>：一度上がったのに押し戻された。上で売りが強い</>,
              <><strong className="text-text-primary">下ヒゲが長い</strong>：一度下がったのに買い戻された。下で買いが強い</>,
              <><strong className="text-text-primary">実体が大きい</strong>：始まりから終わりまで一方向に進んだ。勢いがある</>,
            ]}
          />
          <Quote>ローソク足の上ヒゲが長いと、売りが強い証</Quote>
          <P>使い方：上がるはずの場所で上ヒゲが続いたら、上がる理由が弱くなっている。持っている買いを見直す合図。ポイント：インジケーターより先に、ローソク足そのものを見る。「一番重要なのはローソク足の情報」（講座）。</P>
        </Block>

        <Block>
          <Sub>時間足 ── 1本が何分ぶんか</Sub>
          <ComparisonTable
            headers={["時間足", "1本の長さ", "主な使い方"]}
            rows={[
              ["5分足", "5分", "エントリーの細かいタイミング"],
              ["1時間足・4時間足", "1時間・4時間", "波の測定、押し目探し"],
              ["日足・週足", "1日・1週間", "大きな流れ、その日の壁"],
            ]}
          />
          <Sub>マルチタイムフレーム ── 大きい足から順に見る</Sub>
          <Steps
            items={[
              "日足・週足：大きな流れはどっち？大きな波のどこにいる？",
              "4時間足：波を測る。安定点と押し目の深さ",
              "1時間足：入る場所の候補をしぼる",
              "5分足：入るタイミングと損切りの位置",
            ]}
          />
          <Quote cite="ノート 動画④">相場はフラクタル。大きな時間軸で起きていることは、小さな時間軸でも繰り返す</Quote>
        </Block>

        <Block>
          <Sub>トレンドとレンジ ── 相場の3つの状態</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">上昇トレンド</strong>：高値も安値も切り上がる</>,
              <><strong className="text-text-primary">下降トレンド</strong>：高値も安値も切り下がる</>,
              <><strong className="text-text-primary">レンジ</strong>：上下の枠の中を行ったり来たり</>,
            ]}
          />
          <P>トレンドは流れに沿えば伸びやすい。レンジは上下の枠で止まりやすい。</P>
          <Sub>ダウ理論 ── トレンドは、終わりの合図が出るまで続く</Sub>
          <P>上昇なら「直近の安値（押し安値）」を割るまで続くと考えます。割れても、すぐ下降とは限りません。下降トレンドと判断する3つの条件は：</P>
          <Steps
            items={[
              "押し安値を下に抜ける：上昇トレンドの終わりの合図",
              "高値が切り下がる：前の高値を超えられない",
              "安値が切り下がる：前の安値を下回る",
            ]}
          />
          <P>3つそろって初めて「下降トレンド」。1つ目だけで売りに飛びつかない。</P>
          <Quote cite="ノート 動画⑨">ダウ理論のリズムが崩れるまではどこまでもついていき、リズムが崩れた時が初めて転換のサイン</Quote>
        </Block>

        <Block>
          <Sub>サポートとレジスタンス ── 床と天井</Sub>
          <P>何度も止まった値段には、そこで売買したい人が集まっている。だから次も止まりやすい。上側の天井がレジスタンス、下側の床がサポートです。</P>
          <Sub>レジサポ転換 ── 天井を抜けると、床に変わる</Sub>
          <P>天井だった線を抜けたあと、今度は床になる。抜けた線まで戻ってきて止まったところは、損切りを近くに置けて有利になりやすい場所です。</P>
        </Block>

        <Block>
          <Sub>チャートの形は「強い形」と「弱い形」の2つだけ</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">強い形（買い）</strong>：ダブルボトムなど。安値を2回試して割れず、ネックラインを上に抜けた</>,
              <><strong className="text-text-primary">弱い形（売り）</strong>：ダブルトップなど。高値を2回試して抜けず、ネックラインを下に割った</>,
            ]}
          />
          <Quote cite="ノート 動画⑥">基本的に相場は無限にループしています。目新しいチャートパターンというのは存在しません</Quote>
          <P>覚える形は「強い形（買い）」と「弱い形（売り）」の2つ。名前より、どちらかを見分ける。形が完成するネックラインのブレイクは、講座でも「鉄板のチャンスポイント」と呼ばれる場所です。</P>
        </Block>

        <Summary
          items={[
            "ローソク足＝4つの値段。陽線・陰線、ヒゲで力関係を読む",
            "大きい足から順に見る：日足→4時間→1時間→5分",
            "ダウ理論：高値・安値の切り上げが崩れるまでトレンドは続く",
            "床と天井、強い形と弱い形：抜けた天井は床に変わる",
          ]}
        />
        <Quiz
          items={[
            { q: "終値が始値より高いローソク足は？", options: "A：陽線　B：陰線　C：ヒゲ", answer: "A ── 終値＞始値で陽線。逆なら陰線。" },
            { q: "上昇トレンドの終わりの合図になりやすいのは？", options: "A：高値の更新　B：押し安値を割る　C：200SMAに触れる", answer: "B ── 押し安値を割るのが合図。ただし下降の確定は3条件そろってから。" },
            { q: "天井だった線を上に抜けたあと、その線は？", options: "A：意味がなくなる　B：床（サポート）に変わりやすい　C：必ず天井に戻る", answer: "B ── レジサポ転換。戻ってきて止まった所は有利な場所になりやすい。" },
          ]}
        />
      </ChapterSection>

      <ChapterSection
        id="chapter-6"
        no="6"
        title="移動平均線"
        sub="20本と200本、2本だけを見る"
        points={["移動平均線（SMA）とは何か", "20SMAと200SMAの役割", "角度と反発の読み方", "レンジと乖離への注意"]}
      >
        <Block>
          <Sub>移動平均線（SMA）── 値段の「平均」をつないだ線</Sub>
          <P>20SMA＝直近20本の終値の平均。平均なので、細かい上下がならされて流れが見やすくなる。</P>
          <Sub>インジケーターは、値段の「結果」を描き直したもの</Sub>
          <ComparisonTable
            headers={["インジケーター", "何を計算しているか", "見えるとされるもの"]}
            rows={[
              ["移動平均線", "過去N本の終値の平均", "流れの向き"],
              ["RSI", "過去N本の上げ幅と下げ幅の比率", "買われすぎ・売られすぎ"],
              ["MACD", "2本の移動平均線の差", "流れの切り替わり"],
            ]}
          />
          <P>値段が動く（原因）→ インジケーターが動く（結果）。結果に「次はどうなる？」と聞かない。移動平均線を「根拠の1つ」として使うだけです。</P>
        </Block>

        <Block>
          <Sub>使うのは、20SMAと200SMAの2本だけ</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">20SMA（短期）</strong>：直近20本の平均。今の流れの向きと、押し目で反発する場所</>,
              <><strong className="text-text-primary">200SMA（長期）</strong>：直近200本の平均。大きな流れの向き。強い壁になりやすい</>,
            ]}
          />
          <P>種類を増やさない。EMAなど他の線は使わず、この2本に慣れる。</P>
          <Note>講座のチャートでは、オレンジ＝20SMA、ピンク＝200SMAで表示しています。</Note>
        </Block>

        <Block>
          <Sub>角度で、流れの強さを読む</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">角度が急</strong>：トレンドが強い。線と同じ方向にトレードすると値幅を取りやすい</>,
              <><strong className="text-text-primary">平ら</strong>：レンジになりやすい。方向感がない</>,
            ]}
          />
          <Sub>移動平均線は「金魚すくいの網」</Sub>
          <Quote cite="講座 ep5-5">移動平均線というのは金魚すくいの網のような存在。まだタッチしていない時は破れにくい。何度もタッチすると脆弱になり、最後は破られる</Quote>
          <Bullets
            items={[
              <><strong className="text-text-primary">はじめて触れた</strong>：跳ね返されやすい（反発）。押し目の候補になる</>,
              <><strong className="text-text-primary">何度も触れた</strong>：支える力が弱っている。抜けやすい</>,
            ]}
          />
        </Block>

        <Block>
          <Sub>注意① ── 20と200の間に入ると、レンジになりやすい</Sub>
          <P>一度高値を抜けなかったあと、値段が20SMAと200SMAの間に入ると、トレンドの力を失ってレンジになりやすい。対処は「違う時間軸や違う通貨ペアを見て、レンジ相場の通貨からは距離を置く」。</P>
          <Sub>注意② ── 20と200が大きく離れたら、トレンドの終わりに注意</Sub>
          <P>乖離（かいり）：20SMAと200SMAが大きく離れているとき、値段は伸びにくい。トレンドの終わりの合図になりやすい。</P>
          <P>一番大事なのは：移動平均線は根拠の1つ。損切り位置やエントリーの精査に使う。主役はローソク足。「エントリーから損切りまでの間に20SMAと200SMAがある」と、支えられて伸びやすい（講座）。</P>
        </Block>

        <Summary
          items={[
            "SMA＝値段の平均の線。細かい上下がならされ、流れが見える",
            "20と200の2本だけ：短期の流れと長期の流れ",
            "角度と反発：急なら強い。何度も触れた線は抜けやすい",
            "間と乖離に注意：2本の間はレンジ、大きく離れたら終わりの合図",
          ]}
        />
      </ChapterSection>

      <ChapterSection
        id="chapter-7"
        no="7"
        title="メンタル"
        sub="最後に勝負を決めるのは、自分"
        points={["人が「損大利小」になる理由", "バイアスと、両方のシナリオ", "損切り・連敗・何もしない時間との付き合い方", "目的と、動じない金額"]}
      >
        <Block>
          <Sub>人は放っておくと「損は大きく、利益は小さく」なる</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">利益が出ると</strong>：「減る前に取りたい」と、すぐ利食いしてしまう</>,
              <><strong className="text-text-primary">損が出ると</strong>：「戻るかもしれない」と、損切りできずに持ち続ける</>,
            ]}
          />
          <Quote cite="ノート 動画⑧">損小利大が絶対的な条件。ただしこれは人間の本能と逆らうもの</Quote>
          <P>だから、入る前に出口を決めて、検証で何度もくり返して体に入れる。</P>
        </Block>

        <Block>
          <Sub>トレードは「メンタルマネジメントゲーム」</Sub>
          <Quote cite="ノート 動画⑦">トレードというのはメンタルマネジメントゲーム。自分の感情をいかにコントロールできるか。最終的に大事なのは、自分の気持ちのコントロール</Quote>
          <P>手法も資金管理も、最後は「決めたことを守れるか」に行き着きます。</P>
        </Block>

        <Block>
          <Sub>バイアス ── 自分の思い込みが、いちばんの敵</Sub>
          <P>よくある思い込み：まだ下げるはず。そろそろ上がるはず。</P>
          <Quote cite="2026.4.3 雇用統計ライブ">結局バイアスがかかった瞬間にボロボロにやられる。トレンドが悪いんじゃなくて、自分の出してしまった目線が良くない</Quote>
          <P>入る前に「上に行く場合」と「下に行く場合」の両方を書く。最初に思った方向の逆から見る。</P>
        </Block>

        <Block>
          <Sub>損切りは、未来への投資</Sub>
          <Quote cite="ノート 動画⑦">損切りというのは未来の投資だと思ってください。次の余力があれば、次の損失分を全然巻き返せる</Quote>
          <Bullets
            items={[
              "負けるパターン①：損切りせずに持ち続ける（塩漬け）",
              "負けるパターン②：損切りされて、ムキになって取り返そうとする",
            ]}
          />
          <P>違うと思ったら、すぐ切って、間を置く。少なくとも5分足2本（10分）。</P>
        </Block>

        <Block>
          <Sub>「何もしない」も、立派な戦略</Sub>
          <Bullets
            items={[
              "トレードは中毒になりやすい：何もしていない時間に、ポジションを持ちたくなる",
              "入りたくなったら：本番ではなく検証ソフトを回す。チャンスは1日に多くて3〜4回",
            ]}
          />
          <Quote cite="ノート 動画⑨">上にも下にも展開しない形、東京時間や夜中2時以降のリズムがない形では静観する</Quote>
        </Block>

        <Block>
          <Sub>急変しても、慌てない</Sub>
          <Quote cite="2026.6.5 雇用統計ライブ（配信中に為替介入）">こういう時は、慌てない。慌てない。一休み、一休み</Quote>
          <Bullets
            items={[
              "急変時にやること：ポジションは損切りに任せる。新しく入らない。次のチャンスまで様子を見る",
              "パニックの正体：「動じない自分を作るか、動じない金額でやるか。それがFXで一番大事」（2026.3.6）",
            ]}
          />
        </Block>

        <Block>
          <Sub>連敗したときのルール</Sub>
          <Steps
            items={[
              <><strong className="text-text-primary">1日2回負けたら、その日は終わり</strong>：取り返しにいかない</>,
              <><strong className="text-text-primary">5連敗したら、内容を見直す</strong>：講座を見直し、講師にトレードノートを見せる（認識のずれが多い）</>,
              <><strong className="text-text-primary">調子が悪い時期は「やめる」を選ぶ</strong>：「これ以上口座を減らさない」という選択ができるのがスキル</>,
            ]}
          />
          <Quote>セルフマネジメントが一番大事。自分をコントロールできるかどうかで勝負が決まる</Quote>
        </Block>
      </ChapterSection>

      <ChapterSection
        id="chapter-8"
        no="8"
        title="リスクと始める前の実務知識"
        sub="安全にスタートし、長く続けるためのルール"
        points={["FXにある7つのリスクと備え", "業者の選び方（一般論）", "口座を作ってから最初のトレードまで", "余裕資金と税金の基本"]}
      >
        <Block>
          <Sub>FXにある7つのリスク</Sub>
          <ComparisonTable
            headers={["リスク", "何が起きるか", "備え"]}
            rows={[
              ["為替変動", "予想と逆に動けば損失", "損切りを先に決める"],
              ["レバレッジ", "利益も損失も大きくなる", "ロットで調整。慣れるまで小さく"],
              ["ロスカット", "意図しない場所で強制決済", "維持率に余裕を。余裕資金で"],
              ["スワップ", "持ち越すと支払いになることも", "原則、翌日に持ち越さない"],
              ["流動性", "発表時や週明けにスプレッドが広がる", "発表の瞬間は持たない"],
              ["操作ミス", "違う銘柄・方向・ロットで注文", "注文前の5つの確認"],
              ["精神の消耗", "含み損を見続けて判断が鈍る", "時間を決める。2回負けたらやめる"],
            ]}
          />
        </Block>

        <Block>
          <Sub>業者の選び方 ── 考え方（一般論）</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">登録と信頼</strong>：国内なら金融庁に登録された業者か。無登録の海外業者について、金融庁は注意を呼びかけています</>,
              <><strong className="text-text-primary">コストの見方</strong>：スプレッドと手数料を合計で見る。「極端に安い」には理由がないか確認</>,
              <><strong className="text-text-primary">出金と規約</strong>：出金の手続きと条件、ロスカットの水準を、口座を作る前に読む</>,
            ]}
          />
          <Note>特定の業者をすすめるものではありません。条件は変わるため、各社と金融庁の最新情報で確認してください。</Note>
        </Block>

        <Block>
          <Sub>口座を作ってから、最初のトレードまで</Sub>
          <Steps
            items={[
              "業者を選ぶ：前の3つで確認",
              "口座を作る：本人確認書類を用意",
              "取引ソフト：MT5など。チャートと注文画面に慣れる",
              "少額を入金：余裕資金の中から",
              "最低ロットで1回：損切りと利食いを入れてから",
            ]}
          />
          <P>最初の目標は「勝つこと」ではなく「決めた通りに入って、決めた通りに出ること」。</P>
        </Block>

        <Block>
          <Sub>余裕資金とは ──「なくなっても生活が変わらないお金」</Sub>
          <Bullets
            items={[
              <><strong className="text-text-primary">使っていいお金</strong>：生活費・貯金とは別に、なくなっても暮らしや判断が変わらないお金</>,
              <><strong className="text-text-primary">使ってはいけないお金</strong>：生活費、借りたお金、近いうちに使う予定のお金</>,
            ]}
          />
          <P>お金の心配がある状態では、冷静な損切りはできません。</P>
        </Block>

        <Block>
          <Sub>税金の基本（2026年時点の一般的な仕組み）</Sub>
          <ComparisonTable
            headers={["比較項目", "国内の業者", "海外の業者"]}
            rows={[
              ["所得の種類", "先物取引に係る雑所得等", "雑所得（総合課税）"],
              ["税率", "一律 約20%（20.315%）", "他の所得と合算（最大約55%）"],
              ["損失の繰り越し", "3年間繰り越せる", "繰り越せない"],
              ["申告", "利益が出たら確定申告が必要な場合がある", "同左"],
            ]}
          />
          <Note>会社員で給与以外の所得が年20万円以下の場合など、例外があります。最新の扱いは国税庁や税理士に確認してください。</Note>
        </Block>

        <Block>
          <Sub>よくある失敗3つと、答え</Sub>
          <Steps
            items={[
              "ボラのない時間に入って、含み損で精神を削る → 「みんなが通る道」。動く時間だけに絞る",
              "手法を次々変える（手法ジプシー）→ 基準を1つに決めて、1年続ける",
              "コツコツ勝って、ドカンと負ける → 損切りは未来の投資。一撃で30%以上は負わない",
            ]}
          />
          <Quote>トレードをギャンブルにするのも、仕事にするのも、あなたの考え方次第</Quote>
        </Block>
      </ChapterSection>

      <section id="glossary" className="container-page scroll-mt-24 border-t border-border py-14 sm:py-16">
        <p className="eyebrow">Appendix</p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight text-text-primary">用語集（50音順）</h2>
        <p className="mt-3 max-w-3xl text-sm leading-8 text-text-secondary sm:text-[15px]">
          分からない言葉は何度でもここへ戻ってください。
        </p>
        <div className="mt-8">
          <ComparisonTable
            headers={["言葉", "意味", "関連章"]}
            rows={[
              ["安定点", "波を生むエネルギーの始点（1波）。勢いのある連続した足", "─"],
              ["移動平均線（SMA）", "直近N本の終値の平均をつないだ線。20と200を使用", "第6章"],
              ["売り（ショート）", "先に売って、安くなったら買い戻す取引", "第1章"],
              ["押し目・押し安値", "上昇の途中の一時的な下げ／その安値", "第5章"],
              ["買い（ロング）", "先に買って、高くなったら売る取引", "第1章"],
              ["逆指値", "今より不利な値段で発動する予約。損切りに使う", "第4章"],
              ["CC（サイクルクローズ）", "161.8〜200%に届いて波が閉じること", "─"],
              ["指値", "今より有利な値段で待つ予約", "第4章"],
              ["始値", "その日・その足の最初の値段。最も有効な水平線", "─"],
              ["証拠金・維持率", "取引の担保／口座の余裕を示す数字", "第3章"],
              ["スプレッド", "買値と売値の差。実質の手数料", "第2章"],
              ["スリッページ", "注文した値段と約定した値段のずれ", "第2章"],
              ["スワップ", "日をまたいで持つと付く金利差", "第2章"],
              ["ダウ理論", "高値・安値の切り上げ（下げ）でトレンドを判断", "第5章"],
              ["建値ガード", "含み益になったら損切りを入った値段へ動かす", "─"],
              ["時間足", "ローソク足1本が何分ぶんか", "第5章"],
              ["トレンド・レンジ", "一方向に進む／上下の枠の中を行き来する", "第5章"],
              ["ネックライン", "強い形・弱い形が完成する線", "第5章"],
              ["pips（ピップス）", "値動きの単位。ドル円は0.01円", "第2章"],
              ["フィボナッチ", "61.8・38.2などの比率。波を測るものさし", "─"],
              ["フラクタル", "大きな波の中に同じ形の小さな波がある", "第5章"],
              ["ボラ（ボラティリティ）", "値動きの大きさ", "第8章"],
              ["マージンコール", "維持率が下がったときの警告", "第3章"],
              ["レジサポ転換", "天井が床に、床が天井に変わること", "第5章"],
              ["レバレッジ", "証拠金の何倍まで動かせるか", "第3章"],
              ["ロスカット", "維持率が下がったときの強制決済", "第3章"],
              ["ロット", "取引量の単位。国内1万通貨・海外10万通貨が多い", "第2章"],
              ["ローソク足", "始値・高値・安値・終値を1本で表す", "第5章"],
              ["RR（リスクリワード）", "損失：利益の比率。目安は1:2", "─"],
            ]}
          />
        </div>
        <div className="mt-10">
          <Callout tone="warning" title="重要">
            本ページは教育目的の解説です。具体的な投資助言や利益保証ではありません。FXは元本を失うリスクがあります。必ず余裕資金の範囲で、ご自身の判断と責任で行ってください。
          </Callout>
        </div>
      </section>
    </div>
  );
}
