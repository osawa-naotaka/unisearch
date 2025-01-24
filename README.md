[english README.md](https://github.com/osawa-naotaka/unisearch/blob/main/README.en.md)

# unisearch.js: 軽量でそこそこ速い、静的サイトのための全文検索エンジン
## 概要
unisearch.jsは静的サイト向けに作られた、完全クライアントサイドの全文検索エンジンです。任意のJavaScriptオブジェクト配列内にある文字列および文字列の配列を検索することができます。検索対象の記事をJavaScriptオブジェクト化することで、サーバーサイドの実装なしに全文検索機能を静的サイト上で実現することができます。

unisearch.jsは非常に簡単に使用することができます。検索のために必要なコードを以下に示します。コードはほんのわずかしか必要ありません。

```
import { LinearIndex, createIndex, search, UniSearchError } from "unisearch.js";

const index = createIndex(LinearIndex, array_of_articles);

if(index instanceof UniSearchError) throw index;
const result = await search(index, "search word");
```

検索のためにWebGPUを使う場合は、LinearIndexの代わりにGPULinearIndexを使います。

```
import { GPULinearIndex, createIndex, search, UniSearchError } from "unisearch.js";

const index = createIndex(GPULinearIndex, array_of_articles);
...
```

unisearch.jsは検索に必要な一通りの機能を備えています。完全一致検索のほか、あいまい検索機能も備えます。さらに、and検索、or検索、not検索、フィールドを限定した検索、スコアリングのウェイト指定の機能があります。Google likeのクエリを使うことができ、直感的です。検索結果はTF-IDFというスコアリング方法を元にソートされ、一致箇所周辺の文字列とともに検索結果が得られます。

unisearch.jsはそこそこ高速です。Wikipediaの記事100個ほど、総サイズ3Mbyte程度に対する完全一致検索は1msec以下で、あいまい検索は50msec以下で完了します。インデックススキームを変更することで、検索速度はさらに向上し、より多くの記事を検索対象にできます。

unisearch.jsは、unicodeで表すことのできる全ての言語を対象に検索できます。一般的な正規化や日本語特有の正規化、グラフェム単位の検索により、漢字の異字体や絵文字に対しても正しく検索できます。

unisearch.jsは他のJavaScriptライブラリに依存していないため、あなたのサイトに簡単に埋め込むことができます。

unisearch.jsをNext.jsやAstro.jsなどのSSGと組み合わせることで、前もってインデックスを作成し、検索開始時にインデックスを読み込むことができます。これらのサンプルもレポジトリに登録してあります。ご利用の際はぜひご覧ください。

- [React and Next.js](https://github.com/osawa-naotaka/unisearch/tree/main/example/react-next)
- [Astro.js](https://github.com/osawa-naotaka/unisearch/tree/main/example/astro)


## 使い方

unisearch.jsは、インデックスの作成と、インデックスを用いた検索、の2ステップをふむことで検索を実現します。インデックス作成はページ読み込み時に1回だけ行い、検索のたびにインデックスを使い回します。

### インデックスの作成
インデックスを作成する関数の型を以下に示します。

```
export function createIndex(
    index_class: IndexClass,
    contents: unknown[],
    env: SearchEnv = {},
): UniSearchIndex | UniSearchError;

export type SearchEnv = {
    field_names?: Record<FieldName, Path>;
    key_fields?: Path[];
    search_targets?: Path[];
    weight?: number;
    distance?: number;
};
```

index_classには全文検索で使用するアルゴリズムをクラスで指定します。通常はLinearIndexクラスを指定します。WebGPUを使用する場合は、GPULinearIndexクラスを指定します。contentsは検索対象のJavaScriptオブジェクトの配列を指定します。検索対象は、このオブジェクトのうち、文字列のフィールドか、文字列の配列のフィールドに限られます。また、文字列のフィールドまでの間に配列のフィールドが挟まる場合は、そのフィールドが文字列であっても検索対象に含まれません。envはインデックス作成及び検索時のデフォルトオプションを指定します。

関数の戻り値は作成されたインデックスです。createIndexの戻り値はUniSearchIndex | UniSearchErrorとなります。指定されたcontentsやenvに問題がある場合は、UniSearchErrorを返します。

検索を行った結果は、配列のインデックスとして得られます。追加で、その検索オブジェクトに属する情報を検索結果として返すこともできます。例えば記事のslugなどを設定することで、検索結果の利用をより容易にできます。

検索結果に任意のフィールドを含めるには、createIndex関数のenv引数に、key_fieldsフィールドを指定します。key_fieldsフィールドには、オブジェクトのルートからkeyフィールドへ向かうパスをドットで区切った文字列の配列として指定します。以下のようなオブジェクト構成でslugとtitleをkeyに指定する例を示します。

```
export const array_of_articles = [
    {
      slug: "introduction-to-js",
      content: "JavaScript is a versatile programming language widely used for web development. It enables interactive features on websites, such as dynamic updates, animations, and form validation. JavaScript is essential for creating modern web applications and supports various frameworks like React and Vue.js.",
      data: {
        title: "Introduction to JavaScript",
        description: "Learn the basics of JavaScript, a powerful language for modern web applications.",
        tags: ["javascript", "web", "programming"]
      }
    },
    ...
];
```

```
const index = createIndex(LinearIndex, array_of_articles, {key_fields: ['slug', 'data.title']});
```

インデックスには、標準で与えられたオブジェクトのテキストフィールド全てをそのまま含みます。そのため、インデックスサイズは検索対象の文章の総サイズにおおむね等しくなります。httpプロトコルではgzip圧縮がなされると思いますが、それでも10Mbyteを超えるような総文章量の場合は、Local Storageを利用してインデックスを保存するなどの工夫が必要となるでしょう。インデックスをjsonファイルとして分離し、検索時に動的にfetchするなどの工夫も必要となります。

また、前述のように、インデックスには全ての文章が含まれるため、本名や住所などのセンシティブな情報を検索対象に含めることは十分に注意してください。

インデックスに含めるフィールドを限定することもできます。指定はenv引数のsearch_targetsフィールドに配列として指定してください。

```
const index = createIndex(LinearIndex, array_of_articles, {search_targets: ['data.title','data.description','data.tags']});
```

インデックスの作成を事前に作成して、ページ読み込み時の処理量を削減することもできます。静的サイトジェネレータ(SSG)を用いる場合、デプロイ時にインデックスを作成し、jsonファイルとして配置することで、クライアント側からfetchを利用したインデックスの読み込みが可能になります。htmlファイルへのバンドルサイズが削減でき、検索を実行しない場合の読み込み時間を短縮てきます。

インデックスをJavaScriptオブジェクトに変換するには、indexToObject関数を使います。

```
export function indexToObject(index: UniSearchIndex): UniSearchIndexObject
```

```
const index = createIndex(LinearIndex, array_of_articles);

if(index instanceof UniSearchError) throw index;

const json = JSON.stringify(indexToObject(index));
```

また、JavaScriptオブジェクトからindexを再構築するにはcreateIndexFromObject関数を使います。

```
export function createIndexFromObject(index: UniSearchIndexObject): UniSearchIndex | UniSearchError;
```

```
const resp = await fetch(index_url);
const re_index = createIndexFromObject(resp.json());

if(re_index instanceof UniSearchError) throw re_index;

const result = await search(re_index, "search word");
```

インデックスのヴァージョンが一致しない場合、エラーが発生します。その場合はunisearch.jsのヴァージョンを合わせてインデックスを再生成してください。

インデックスの生成には多少時間がかかります。100記事程度、全文で3MByte程度の場合、500msec程度かかります。

### インデックスを用いた検索
インデックスを作成したあとは、同じインデックスを使って何度も検索を実行できます。

```
export async function search(index: UniSearchIndex, query: string): Promise<SearchResult[] | UniSearchError>
```

クエリは文字列としてインデックスとともにsearch関数に与えます。クエリの書式はおおむねGoogle検索の書式に類似しています。

- あいまい検索

unisearch.jsは標準であいまい検索を行います。あいまい検索では、デフォルトで1文字の間違い(編集距離)まで許容します。間違いの文字数を増やすには、「distance:2 検索文字列」のように、検索文字列の前に許容する間違いの数を正の整数で与えます。distanceとコロンと整数の間にはスペースをあけず、整数と検索文字列をあとはスペースをあけます。以下、検索文字列にオプションを指定する場合は同様のフォーマットを使います。

毎回設定するのではなく、一律で編集距離を設定するには、インデックス作成時にenv引数のdistanceフィールドに指定する編集距離を設定します。また、編集距離を0にすることで、あいまい検索を無効化できます。

```
const index = createIndex(LinearIndex, array_of_articles, {distance: 2});
```

- 完全一致検索

完全一致検索を行うには、「"検索文字列"」のように、検索文字列をダブルクォーテーションで囲います。ダブルクォーテーションの中にスペースを含めた場合、そのスペース込みで完全一致検索を行います。ダブルクォーテーションの中はエスケープシーケンスに対応し、ダブルクォーテーション自体を検索文字列に加えるには「\"」と入力します。

- and検索

「検索文字列1 検索文字列2」のように、検索文字列を空白で区切ることにより、両方の文字列を含む文章を検索します。空白は、いわゆる全角スペース、半角スペース、タブ、改行など、unicodeにおける一通りの空白に対応します。

- not検索

検索ワードの前に「-検索文字列1 検索文字列2」「-"検索文字列1" 検索文字列2」のようにマイナスをつけることで、その文字列を含まない文章を検索することができます。この例では、検索文字列1を含まず、検索文字列2を含む文章が検索されます。not検索は常にand検索と一緒に使われます。not検索が単体で使われた場合には、その検索ワードは無視されます。

- or検索

検索文字列同士を「検索文字列1 OR 検索文字列2」のように、空白で区切られた大文字のORで区切ることにより、検索文字列1と検索文字列2のどちらか一方、または両方が含まれた文章を検索します。結合の強さはandがorより強く、例えば「検索文字列1 検索文字列2 OR 検索文字列3」は、検索文字列1とを両方含む文章、または、検索文字列3を含む文章が検索されます。


- 検索フィールド限定

インデックスした文章全てを検索対象とせず、一部のみを検索対象とすることができます。例えば、前の例でslugフィールドだけ検索対象に含めるには、「from:slug 検索文字列」と入力します。from:直後のフィールド指定は、デフォルトでフィールドへのパス文字列の最後を指します。例えば、「data.title」を指定するには、「from:title 検索文字列」と入力します。

フィールド指定文字列はインデックスを作る際にカスタマイズできます。例えば、slugをfrom:linkという指定で検索できるようにするには、引数envのfield_namesに設定をします。

```
const index = createIndex(LinearIndex, array_of_articles, { field_names: { link: "slug" } });
```

- スコアの重み変更

例えば、「from:title weight:2.5 検索文字列」とすることで、titleフィールドで検索文字列を検索し、そのスコアを2.5倍します。weight:直後には正の整数または小数が指定できます。from:を指定しなくても動作し、その場合は指定されたキーワードに該当する文章のスコアが2.5倍されます。


### 検索結果
検索結果はSearchResult型の配列として得られます。

```
export type SearchResult = {
    id: number;
    key: string | null;
    score: number;
    refs: Reference[];
};
```

idフィールドは、一致した文章の配列インデックスを返します。インデックス作成時の配列インデックスです。keyフィールドは、インデックス作成時に指定したフィールドが設定されます。scoreはTF-IDFに基づいた値が設定されます。検索ワード個々のTF-IDFの合算値になり、編集距離が増えるごとに1/xで減じられていきます。

refsフィールドは、検索で一致した箇所の情報の配列が設定されます。

```
export type Reference = {
    token: string;
    path: Path;
    pos?: number;
    wordaround?: string;
    distance: number;
};
```

tokenにはクエリ中の個々の検索文字列が設定されます。pathはどのフィールドから検索ワードが見つかったかをフィールドへのパスで示します。posは一致した箇所への、文章の先頭からの文字数です。あいまい検索時は、挿入や削除などの状態により少しposの位置がずれます。wordaroundは、一致した箇所の前後の文字が指定されます。distanceは、あいまい検索にて一致した場合の編集距離が指定されます。

## 高速検索用インデックスの作成

静的サイトに使われる前提の、ほとんどのユースケースにおいて、前述のLinearIndexに基づく全文検索で十分なパフォーマンスが達成できます。
しかし、もしもっと高速な検索を必要とする場合、違うインデックス形式を使うことにより、検索の高速化が達成できます。

### GPU Linear Index
```
import { GPULinearIndex, createIndex, search, UniSearchError } from "unisearch.js";

const index = createIndex(GPULinearIndex, array_of_articles);
```

GPULinearIndexを使うことにより、あいまい検索をGPUで行います。インデックスが100記事、3Mbyte程度の場合、おおよそ2倍程度の高速化が達成できます。
検索の使い方はLinearIndex時と全く同一です。また、GPUが使えない環境では自動的にLinearIndexが代わりに使われます。
一方、インデックスがより少ない場合は、LinearIndexのほうが高速になる場面が多くなります。

### Hybrid Bigram Inverted Index
```
import { HybridBigramInvertedIndex, createIndex, search, UniSearchError } from "unisearch.js";

const index = createIndex(HybridBigramInvertedIndex, array_of_articles);
```

HybridBigramInvertedIndexを使うことにより、おおよそ10-100倍の検索速度向上がみられます。検索の使い方はLinearIndex時と全く同一です。

ただし、検索の速度向上のかわり、多数の欠点も存在します。

1. インデックス生成に時間がかかります。100記事で3-6秒ほどです。そのため、SSGなどで前もってインデックスを作ることが必須になります。
2. 検索ノイズが増えます。false positive(一致するはずのない文章が検索結果に出てきてしまう)が増加します。
3. 日本語などを対象にしたあいまい検索はかなりノイズが増えます。意図した編集距離より遠い文字列にもマッチしてしまいます。
4. 検索結果の情報の一部が欠けます。posとwordaroundが存在しなくなります。
5. TF-IDFに基づくスコアリングが未完成です。今は単純なTFのみ計算しています。

総合的に見て、HybridBigramInvertedIndexを使う価値はあまりありません。どうしても高速な検索が必要な場合のみ利用を検討してください。

## ベンチマーク

Intel Core i5 13400F + NVIDIA GeForce RTX 4070を使ったベンチマークを以下に示します。index sizeの単位はbyteで、他のフィールドの単位はmsecです。

### 完全一致検索
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 0.1084 | 0.1146 | 0.0784   |
| 789021     | 0.1498 | 0.1548 | 0.0824   |
| 1305328    | 0.2194 | 0.2264 | 0.0958   |
| 2394217    | 0.3442 | 0.3618 | 0.1254   |
| 3020497    | 0.4134 | 0.435  | 0.0984   |

### あいまい検索
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 2.7128 | 4.594 | 0.1128   |
| 789021     | 4.5344 | 5.684 | 0.1182   |
| 1305328    | 7.4618 | 7.0552 | 0.1472   |
| 2394217    | 13.6572  | 8.6452   | 0.1968   |
| 3020497    | 17.2486  | 9.038    | 0.226    |

### インデックス生成
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 20.04  | 20.04 | 373.48   |
| 789021     | 30.36  | 36.04 | 626.14   |
| 1305328    | 72.3   | 60.86 | 1009.88  |
| 2394217    | 123.36 | 126.12 | 1782.74  |
| 3020497    | 158.4  | 159.84 | 2361.58  |

同様に、Intel N100を使ったベンチマークを以下に示します。

### 完全一致検索
| index size |	Linear|	GPU	| Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 0.2984 | 0.405 | 0.2912   |
| 789021     | 0.4336 | 0.5104 | 0.3136   |
| 1305328    | 0.6962 | 0.5976 | 0.4366   |
| 2394217    | 0.955  | 0.9446 | 0.3536   |
| 3020497    | 1.0758 | 1.0874 | 0.4388   |

### あいまい検索
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 6.5576 | 8.6892 | 0.3864   |
| 789021     | 11.3006 | 9.6058 | 0.413    |
| 1305328    | 17.8096 | 13.2846 | 0.6518   |
| 2394217    | 31.8176 | 18.4438 | 0.7692   |
| 3020497    | 40.6314 | 22.5536 | 1.0842   |

### インデックス生成
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 62.5   | 63.98 | 1076.14  |
| 789021     | 108.82 | 131.28 | 1725.02 |
| 1305328    | 189.16 | 203.3 | 2809.88 |
| 2394217    | 332    | 333.74 | 5114.64 |
| 3020497    | 433.86 | 426.08 | 6377.6  |

## 検索アルゴリズムの紹介

### LinearIndex

LinearIndexを使う場合、完全一致検索アルゴリズムは非常に単純です。単純というか、JavaScript組み込みのString.prototype.indexOf()を使っているだけです。おそらく、V8などのエンジンの側で最適化しているのでしょう、全文を愚直に検索している割にはとても高速に動きます。さすがに1万記事などに増えると速度が満足いかなくなりますが、その場合インデックスサイズも100MByte単位になっているはずで、静的サイトの全文検索対象としてはかなり非現実的です。

あいまい検索は、教科書通りのbitapアルゴリズムを用いています。indexOfに比べ50倍程度遅い速度です。Rust-WASMでbitapを実現してみましたが、JavaScriptで実現した場合に比べて非常に遅くなったため、採用を見送りました。検索対象の文字はIntl.Segmenter()を使ってグラフェム単位に分割しています。そのため、漢字の異字体や絵文字、国旗などなど、複数のコードポイントからなる文字についても、正しく編集距離を計算できます。ただし、グラフェム単位のインデックスを普通の文字列のインデックスと別に生成するため、メモリ使用量が倍になっています。

### GPULinearIndex

GPULinearIndexでは、完全一致検索はLinearIndexと全く同じアルゴリズムを使います。また、あいまい検索文字列が32文字を超える場合もLinearIndexと同じアルゴリズムを使います。
あいまい検索は、bitapアルゴリズムをGPUで実現しています。インデックス中の全ての文字位置ごとに検索用のスレッドを生成し、その中で検索文字列長だけbitapアルゴリズムに基づく一致検索を行います。

### HybridBigramInvertedIndex

HybridBigramInvertedIndexは、日本語のような、単語の分かち書きが難しい言語と、英語のような、空白で単語が区切れる言語、それぞれに文字を分類して、違うインデックスを生成することで検索を実現しています。英語は普通の単語単位の転置インデックスを作り、日本語などは分かち書きせずBigramで文章を断片化して転置インデックスを生成しました。
Trigramなど、Ngramを増やすことで検索ノイズは軽減できるのですが、その代わりインデックスサイズが大きくなってしまうため、バランスをみてBigramを採用しました。

### 前処理

前処理は単純です。Unicodeの正規化(NFKC)や英文字などの小文字化、日本語の一部の正規化をしている程度です。また、1グラフェムが複数のコードポイントで構成される文字（絵文字など）は、最初のコードポイントだけを抜粋して検索対象とします。転置インデックスの英語などにおいてもストップワードやステミングは採用していません。言語中立を目指したため、あまり特殊な処理は入れずに検索できる範囲の能力を目指しました。

HybridBigramInvertedIndexでは、上記に加え、約物・記号の削除とそれらをデリミタとした分割、空白による分割、文字種（日本語のようにトークナイズできない言語とできる言語を分類）による分割を行っています。そのため、記号単体では検索できず、URLもトークナイズされます。全言語に共通で分かち書きできる機構があれば良いのですが、未だ未完の状態のようです。一応、Intl.Segmenter()は日本語と中国語の分かち書きができるらしいので、今後に期待します。

### その他の検討アルゴリズム

Trieを試したところ、インデックスサイズが逆に大きくなってしまいました。インクリメンタルな検索のため、全てのノードにポスティングリストを追加したせいだと思われます。言語中立を目指し、日本語をインデックス化する場合は、Bigramを採用するためTrieにするうまみがほとんどなく、採用を見送りました。

Bloomフィルターを使うことを検討しましたが、ハッシュ関数の個数分だけポスティングリストのサイズが増大してしまい、インデックスサイズがこれも逆に大きくなってしまいました。面白そうなデータ構造だったのですが、残念です。ちなみに、ハッシュ関数は2-3個程度が良いスペックが出ました。

LSHやminHash、sentence transformerによる埋め込みなど、他にも色々頭に浮かんだこともありますが、どれもぼくの思い違いで、特にあいまい検索を含む全文検索に応用できるものではありませんでした。単純な完全一致なら可能性はあったのですが、あいまい検索はかなり無理そうでした。例えば、スペリングを間違った単語を入力した場合、それは、新たに辞書に単語が追加されることになり、結果として、超高次元のベクトルに対して次元が1個増えることになります。編集距離が短い次元との距離は、他の次元の距離と同一で、比べようがありません。そこから次元削減なりを行っても、正しく類似単語ににたベクトルを生成できるとは思えませんでした。ただ、セマンティック検索自体の可能性は少し感じました。軽い検討をした結果、セマンティック検索はサーバーが必要なスペックになるとわかったため、また別の機会に実現を考えてみようと思います。
