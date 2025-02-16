[README.md in English](https://github.com/osawa-naotaka/staticseek)

# staticseek: 静的サイト向けの軽量で高速な全文検索エンジン

## 概要
staticseekは、静的ウェブサイト向けに特化して設計されたクライアントサイドの全文検索エンジンです。文字列または文字列配列を含むJavaScriptオブジェクトの配列を検索できます。記事をJavaScriptオブジェクトに変換することで、サーバーサイドの実装なしに静的サイトで全文検索機能を実装できます。

## 主な機能
- シンプルで直感的なAPI
- カスタマイズ可能な編集距離によるあいまい検索のサポート
- 高度な検索オプション（AND、OR、NOT）
- 検索対象の限定が可能
- カスタマイズ可能な重み付けによるTF-IDFベースのスコアリング
- Googleに似たクエリ構文
- CJK文字や絵文字を含むすべての言語のUnicodeサポート
- さまざまな要求性能に対応する複数のインデックス実装
- 依存ライブラリゼロ
- 静的サイトジェネレーター（SSG）とのシームレスな統合

## クイックスタート

最初に、staticseekをインストールします。

```shell
npm install staticseek
```

次に、検索機能を使いたいプロジェクトにstaticseekをインポートし、インデックスの作成と検索を実行します。

```javascript
import { LinearIndex, createIndex, search, StaticSeekError } from "staticseek";

// インデックスを作成
const index = createIndex(LinearIndex, array_of_articles);
if(index instanceof StaticSeekError) throw index;

// 検索を実行
const result = await search(index, "検索語");
```

WebGPUを使い検索を高速化するには、以下のようにします。

```javascript
import { GPULinearIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(GPULinearIndex, array_of_articles);
if(index instanceof StaticSeekError) throw index;

const result = await search(index, "検索語");
```

性能に問題がある場合は、以下のようにしてあいまい検索を無効化してください。

```javascript
import { LinearIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(LinearIndex, array_of_articles, { distance: 0 });
if(index instanceof StaticSeekError) throw index;

const result = await search(index, "search word");
```


## 検索機能

### クエリ構文
- **あいまい検索**: デフォルトの動作で、編集距離を設定可能
  - `distance:2 検索語` - 2文字の挿入・削除・入れ替えを許可
- **完全一致**: `"検索語"`
- **AND検索**: `検索語1 検索語2`
- **OR検索**: `検索語1 OR 検索語2`
- **NOT検索**: `-検索語1 検索語2`
- **検索対象の限定**: `from:title 検索語`
- **重み付け**: `from:title weight:2.5 検索語`

### インデックスの種類

1. **LinearIndex**（デフォルト）
   - 小規模から中規模のコンテンツに最適
   - シンプルで信頼性が高いインデックス
   - 検索速度と精度のバランスが良い

2. **GPULinearIndex**
   - WebGPUで高速化されたあいまい検索
   - 大規模なデータセットで約2-10倍高速
   - WebGPUが利用できない場合はLinearIndexに自然にフォールバック

3. **HybridTrieBigramInvertedIndex**
   - ~100倍の高速な検索速度
   - 大規模なデータセットに最適
   - トレードオフ：
     - インデックス生成が遅い
     - CJK言語の擬陽性(検索結果に無関係な結果が表示される)が増える
     - CJK言語のあいまい検索の精度が低い
     - 検索結果のメタデータが限られている

## 検索速度・インデックス作成速度

4MBのデータセット（約100記事）の検索速度は概ね以下の通りです。

- 完全一致: < 5ms
- あいまい検索: < 150ms
- インデックス生成: ~500ms
  - HybridTrieBigramInvertedIndexの場合は~30s

さまざまなハードウェア構成とインデックスタイプにわたる詳細なベンチマークについては、[ベンチマークセクション](#ベンチマーク)を参照してください。

## 静的サイトジェネレーター(SSG)との統合

次の実装例が利用可能です。
- Next.js
  - [基本的な使用例](https://github.com/osawa-naotaka/staticseek/tree/main/example/next/01.basic)
  - [インデックス事前作成＆遅延読み込み](https://github.com/osawa-naotaka/staticseek/tree/main/example/next/02.preindexed)
- Astro
  - [基本的な使用例](https://github.com/osawa-naotaka/staticseek/tree/main/example/astro/01.basic)
  - [インデックス事前作成＆遅延読み込み](https://github.com/osawa-naotaka/staticseek/tree/main/example/astro/02.preindexed)
- Nuxt
  - [基本的な使用例](https://github.com/osawa-naotaka/staticseek/tree/main/example/nuxt/01.basic)
  - [インデックス事前作成＆遅延読み込み](https://github.com/osawa-naotaka/staticseek/tree/main/example/nuxt/02.preindexed)

## 制限事項

- インデックスサイズは、ほぼテキストの合計サイズに等しい
- WebGPUの高速化には、互換性のあるハードウェア/ブラウザが必要
- 非常に大きなデータセット（> 10MB）に対するサポートが限られている

## 検索インデックスの作成

staticseekは、インデックス作成と検索実行の2つのフェーズで動作します。インデックスはページが読み込まれるときに1回作成され、後続のすべての検索で再利用されます。

### インデックス作成

```typescript
type Path = string;
type FieldName = string;

function createIndex(
    index_class: IndexClass,
    contents: unknown[],
    env: SearchEnv = {},
): StaticSeekIndex | StaticSeekError;

type SearchEnv = {
    field_names?: Record<FieldName, Path>;
    key_fields?: Path[];
    search_targets?: Path[];
    weight?: number;
    distance?: number;
};
```

#### パラメータ

- `index_class`: 検索アルゴリズムの実装を指定
  - `LinearIndex`: 標準実装（デフォルトの選択）
  - `GPULinearIndex`: WebGPUで高速化された実装
  - `HybridTrieBigramInvertedIndex`: 大規模データセット向けの高性能実装

- `contents`: インデックス化されるJavaScriptオブジェクトの配列
  - 文字列フィールドと文字列配列フィールドをサポート
  - 文字列を含むネストされた配列は検索から除外される

- `env`: インデックス作成と検索の構成オプション（オプション）
  - `field_names`: 検索クエリ用のカスタムフィールドマッピング（例：`{ link: "slug" }`）
  - `key_fields`: 検索結果に含めるフィールド
  - `search_targets`: 検索用にインデックス化するフィールド
  - `weight`: スコアリングのデフォルトの重み
  - `distance`: あいまい検索のデフォルトの編集距離

この関数は、`StaticSeekIndex`オブジェクトまたは`StaticSeekError`を返します。
envやcontentsが正しく設定されていない場合はStaticSeekErrorを返します。

### 検索結果の設定

インデックスを作成するときに、検索結果に含めるフィールドを指定できます。以下にデータ構造の例を示します。

```javascript
const array_of_articles = [
    {
      slug: "introduction-to-js",
      content: "JavaScriptは、ウェブ開発で広く使用されている汎用プログラミング言語です。ウェブサイト上の動的な更新、アニメーション、フォーム検証などのインタラクティブな機能を有効にします。JavaScriptは、最新のWebアプリケーションを作成するために不可欠であり、ReactやVue.jsなどのさまざまなフレームワークをサポートしています。",
      data: {
        title: "JavaScript入門",
        description: "最新のWebアプリケーション向けの強力な言語であるJavaScriptの基本を学びます。",
        tags: ["javascript", "web", "programming"]
      }
    },
    // ...
];
```

検索結果に特定のフィールドを含めるには、`key_fields`オプションを使用します。

```javascript
const index = createIndex(LinearIndex, array_of_articles, {
    key_fields: ['slug', 'data.title']
});
```

### インデックスサイズの制御

#### フィールドの選択
`search_targets`オプションを使用して、インデックス化するフィールドを制限できます。

```javascript
const index = createIndex(LinearIndex, array_of_articles, {
    search_targets: ['data.title', 'data.description', 'data.tags']
});
```

#### ストレージに関する考慮事項
- インデックスサイズは、ほぼテキストの合計サイズに等しい
- HTTP圧縮（gzip）は転送サイズを削減するのに役立つ
- インデックスが1MBを超える場合は、以下を検討してください。
  - ローカルストレージを使用する
  - fetch()による動的読み込み

### 静的サイトジェネレーターの統合

静的サイトの場合、ページ読み込み時間を少なくするために、サイトのビルド時にインデックスを事前生成します。

1. インデックスをシリアライズ可能なオブジェクトに変換します。
```javascript
function indexToObject(index: StaticSeekIndex): StaticSeekIndexObject

const index = createIndex(LinearIndex, array_of_articles);
if(index instanceof StaticSeekError) throw index;
const json = JSON.stringify(indexToObject(index));
```

2. クライアントでインデックスをロードして再構築します。
```javascript
function createIndexFromObject(index: StaticSeekIndexObject): StaticSeekIndex | StaticSeekError;

const resp = await fetch(index_url);
const re_index = createIndexFromObject(resp.json());
if(re_index instanceof StaticSeekError) throw re_index;
const result = await search(re_index, "検索語");
```

## 検索の実行

インデックスが作成されると、同じインデックスを使用して複数の検索を実行できます。

```typescript
async function search(index: StaticSeekIndex, query: string): Promise<SearchResult[] | StaticSeekError>
```

### クエリ構文

#### あいまい検索
デフォルトでは、staticseekは編集距離が1のあいまい検索を実行します。
つまり、検索語あたり1文字のエラーを許容します。この許容範囲は、次の2つの方法で調整できます。

個々の検索では、クエリで編集距離を指定します。
```
distance:2 検索語    // 最大2文字の違いを許可
```

"distance:"と"2"の間にスペースは入れないでください。

すべての検索で異なるデフォルトの編集距離を設定するには、インデックス作成時に設定します。
```javascript
const index = createIndex(LinearIndex, array_of_articles, {
    distance: 2  // すべての検索でデフォルトの編集距離を設定
});
```

編集距離を0に設定すると、あいまい検索は無効になり、代わりに完全一致検索が実行されます。

#### 完全一致検索
完全なフレーズ一致には二重引用符を使用します。
```
"完全なフレーズ"    // スペースを含む完全なフレーズに一致
```
検索語に二重引用符を含めるには、`\"`を使用します。

#### ブール演算
- **AND検索**: 検索語をスペースで区切ります。両方の検索語がマッチするドキュメントが検索されます。
  ```
  検索語1 検索語2    // 両方の検索語を含むドキュメント
  ```

- **OR検索**: 検索語同士を" OR "で区切ります。片方の検索語だけのマッチでも検索結果に現れます。
  ```
  検索語1 OR 検索語2    // いずれかの検索語を含むドキュメント
  ```

- **NOT検索**: 検索語の頭にマイナス記号をつけます。特定の用語を含むドキュメントを除外します。
  ```
  -検索語1 検索語2    // 検索語2を含み、検索語1を含まないドキュメント
  ```
  注: NOT検索はAND検索と併用する必要があります。NOT検索語だけのクエリは無視されます。

#### フィールド固有の検索
特定のフィールドに検索を限定します。
```
from:title 検索語    // titleフィールドのみを検索
```

インデックス作成時にカスタムフィールド名を構成します。
```javascript
const index = createIndex(LinearIndex, array_of_articles, {
    field_names: { link: "slug" }  // "from:link"でslugフィールドを検索できるようにする
});
```

#### スコアの重み付け
特定の検索語のスコアを調整します。
```
from:title weight:2.5 検索語    // titleフィールドに検索語が一致した場合、そのスコアを2.5倍に増やす
```

### 検索結果

検索結果は、`SearchResult`オブジェクトの配列として返されます。

```typescript
export type SearchResult = {
    id: number;
    key: Record<string, unknown>;
    score: number;
    refs: Reference[];
};
```

- **id**: 元の配列内の一致するドキュメントのインデックス位置。
- **key**: 元のドキュメントから指定されたフィールドを含むオブジェクト。たとえば、`['slug', 'data.title']`が`key_fields`として設定されている場合、keyには`{ slug: "一致するslug", data: { title: "一致するタイトル" } }`が設定されます。
- **score**: TF-IDFベースの関連性スコア。スコアが高いほどより一致度が高いことを示します。スコアは、あいまい検索の編集距離に比例して減少します。
- **refs**: 一致箇所の詳細を含む`Reference`オブジェクトの配列。

```typescript
export type Reference = {
    token: string;
    path: Path;
    pos?: number;
    wordaround?: string;
    distance: number;
};
```

- **token**: 一致した特定の検索語。
- **path**: 一致が見つかったフィールド。
- **pos**: テキスト内の一致の位置（フィールドの先頭からの文字インデックス）。あいまい一致の場合、挿入/削除によりわずかなずれが生じる可能性があります。
- **wordaround**: 一致箇所の周囲のテキスト。
- **distance**: あいまい検索で一致した場合の編集距離。

### 重要な注意事項

- **バージョンの互換性**: インデックス生成と検索実行を通して、staticseekのバージョンが一致していることを確認してください
- **パフォーマンス**: インデックス生成には、100記事（約4MBのテキスト）で約500ms、`HybridTrieBigramInvertedIndex`を利用した場合は約10-30秒かかります。
- **セキュリティ**: インデックス化されたコンテンツに機密情報（個人名、住所）を含めることは避けてください。
- **最適化**: SSGでインデックスを事前に生成すると、クライアント側の処理が減少し、ロード時間が短縮されます。
- **Unicodeサポート**: すべての空白タイプ（全角、半角、タブ、改行など）がクエリでサポートされています。

## より高速な検索のためのインデックス作成

`LinearIndex`が提供する全文検索機能は、ほとんどの静的サイトのユースケースで十分です。ただし、さらに高速な検索性能が必要な場合は、代替のインデックス作成方法を利用して、速度と効率を最適化できます。

### GPU Linear Index

```javascript
import { GPULinearIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(GPULinearIndex, array_of_articles);
```

`GPULinearIndex`を活用することで、あいまい検索をGPUにオフロードできるため、検索速度が向上します。この方法は、`LinearIndex`の2倍から10倍程度の検索速度を達成できます。使用方法は`LinearIndex`と同じままであるため、実装を簡単に切り替えることができます。

実行環境でGPUが利用できない場合、`GPULinearIndex`は自動的に`LinearIndex`にフォールバックし、さまざまなデバイス間での互換性を確保します。

### Hybrid Trie Bigram Inverted Index

```javascript
import { HybridTrieBigramInvertedIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(HybridTrieBigramInvertedIndex, array_of_articles);
```

`HybridTrieBigramInvertedIndex`は、`LinearIndex`と比較して、10-100倍程度、検索速度が向上します。APIの使用法は完全に同じです。

ただし、この速度の向上にはいくつかのトレードオフが発生します。

1. **インデックス作成時間の延長**: インデックス作成は大幅に遅くなり、100記事で約10-30秒かかります。静的サイト生成（SSG）ビルドプロセス中など、インデックスを事前に生成することが不可欠です。
2. **CJK言語の検索ノイズの増加**: 中国語、日本語、韓国語などの言語での偽陽性（検索結果に無関係な結果が表示される）が増えます。
3. **CJK言語の精度の低下**: 中国語、日本語、韓国語などの言語でのあいまい検索は、意図しない用語に一致し、検索ノイズの多い結果になる場合があります。
4. **結果メタデータの制限**: 正確な一致位置（`pos`）や周囲のテキスト（`wordaround`）などの一部の検索結果の詳細は利用できません。
5. **不完全なTF-IDFスコアリング**: 現在、用語頻度（TF）のみが計算されており、ランキングの精度が低くなります。

これらの欠点はありますが、`HybridTrieBigramInvertedIndex`はすべてのデバイスで超高速な検索速度を達成します。応答性を優先することが重要な場合、このインデックスタイプは強力な選択肢です。

## ベンチマーク

### Intel Core i5 13400FおよびNVIDIA GeForce RTX 4070でのベンチマーク

以下のベンチマークは、**Intel Core i5 13400F**と**NVIDIA GeForce RTX 4070**を使用して実施しました。インデックスサイズはキリバイト単位で表され、その他のすべてのメトリックはミリ秒（ms）単位で測定されます。

#### **Exact Search Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 0.45 | 0.44 | 0.11 |
| 829 | 0.66 | 0.69 | 0.08 |
| 1712 | 1.27 | 1.32 | 0.11 |
| 3001 | 2.17 | 2.24 | 0.10 |
| 3748 | 2.68 | 2.70 | 0.10 |

---

#### **Fuzzy Search Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 10.86 | 4.83 | 0.09 |
| 829 | 16.76 | 5.63 | 0.10 |
| 1712 | 34.31 | 5.96 | 0.10 |
| 3001 | 59.62 | 5.88 | 0.13 |
| 3748 | 74.55 | 6.57 | 0.14 |

---

#### **Fuzzy Search Time (ms) (Japanese)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 476 | 3.53 | 4.17 | 0.10 |
| 789 | 5.09 | 4.24 | 0.10 |
| 1305 | 8.58 | 4.47 | 0.11 |
| 2394 | 15.48 | 4.87 | 0.11 |
| 3020 | 19.65 | 5.45 | 0.13 |

---

#### **Indexing Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 39.92 | 42.30 | 1,738 |
| 829 | 69.14 | 68.48 | 2,731 |
| 1712 | 149.00 | 141.24 | 5,819 |
| 3001 | 290.62 | 273.20 | 10,521 |
| 3748 | 363.58 | 338.52 | 12,992 |

---

#### **Index Size (Gzipped, kbyte) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 191 | 191 | 91 |
| 829 | 294 | 294 | 131 |
| 1712 | 607 | 607 | 247 |
| 3001 | 1057 | 1057 | 411 |
| 3748 | 1324 | 1324 | 505 |

---

#### **Index Size (Gzipped, kbyte) (Japanese)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 476 | 165 | 165 | 136 |
| 789 | 272 | 272 | 229 |
| 1305 | 452 | 452 | 366 |
| 2394 | 837 | 837 | 644 |
| 3020 | 1053 | 1053 | 813 |


### Intel N100でのベンチマーク

低電力デバイスでのパフォーマンスを評価するために、**Intel N100** CPUを使用してベンチマークを実施しました。

#### **Exact Search Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 1.09 | 1.16 | 0.34 |
| 829 | 1.45 | 1.55 | 0.49 |
| 1712 | 2.64 | 2.64 | 0.32 |
| 3001 | 3.99 | 4.27 | 0.41 |
| 3748 | 5.31 | 5.32 | 0.45 |

---

#### **Fuzzy Search Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 21.27 | 8.50 | 0.28 |
| 829 | 32.17 | 10.48 | 0.36 |
| 1712 | 64.99 | 14.93 | 0.32 |
| 3001 | 113.41 | 21.89 | 0.43 |
| 3748 | 140.33 | 25.98 | 0.68 |

---

#### **Fuzzy Search Time (ms) (Japanese)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 476 | 6.63 | 5.66 | 0.27 |
| 789 | 10.76 | 6.88 | 0.27 |
| 1305 | 17.75 | 6.94 | 0.29 |
| 2394 | 31.11 | 8.06 | 0.38 |
| 3020 | 39.35 | 9.12 | 0.61 |

---

#### **Indexing Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 121.82 | 122.58 | 4422 |
| 829 | 191.94 | 191.46 | 6707 |
| 1712 | 403.90 | 377.72 | 14501 |
| 3001 | 709.00 | 715.72 | 25726 |
| 3748 | 912.72 | 861.46 | 32124 |

---

#### **Index Size (Gzipped, kbyte) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 191 | 191 | 91 |
| 829 | 294 | 294 | 131 |
| 1712 | 607 | 607 | 247 |
| 3001 | 1057 | 1057 | 411 |
| 3748 | 1324 | 1324 | 505 |

---

#### **Index Size (Gzipped, kbyte) (Japanese)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 476 | 165 | 165 | 136 |
| 789 | 272 | 272 | 229 |
| 1305 | 452 | 452 | 366 |
| 2394 | 837 | 837 | 644 |
| 3020 | 1053 | 1053 | 813 |


これらのベンチマークは、さまざまなインデックスタイプ間の性能のトレードオフを示しています。`HybridTrieBigramInvertedIndex`は高速ですが、インデックス作成時間が長くなり、検索精度が低下するという代償があります。一方、`GPULinearIndex`は精度を維持しながら速度向上が望めるため、GPUサポートのある環境では検討に値するでしょう。

最適な性能を得るには、ご利用の環境に即したインデックスタイプを選択してください。

## 検索アルゴリズムの概要

### LinearIndex

`LinearIndex`は、単純な完全一致検索アルゴリズムを利用します。カスタムの検索アルゴリズムを実装するのではなく、JavaScriptに組み込まれた`String.prototype.indexOf()`を単に活用します。V8などのJavaScriptエンジンの最適化により、このアプローチは全文検索でも高速に動作します。ただし、ドキュメント数が増加するにつれて、検索速度が低下します。ただ、このような規模では、インデックスサイズが数十メガバイトに達し、静的サイトでの全文検索が非現実的になるでしょう。

あいまい検索には、`bitap`アルゴリズムが使用されます。これは`indexOf()`よりも約50倍遅く実行されます。`bitap`をRust-WASMで実装してみましたが、検索速度がJavaScriptバージョンよりも大幅に遅かったため、候補から除きました。検索プロセスでは、`Intl.Segmenter()`を使用して文字をグラフェムにセグメント化し、漢字や絵文字、国旗などの複雑な文字でも編集距離が正しく計算されるようにします。ただし、グラフェムごとに個別のインデックスを維持する必要があるため、メモリ使用量が事実上2倍になります。

### GPULinearIndex

`GPULinearIndex`は、`LinearIndex`と同じ完全一致アルゴリズムを使います。32文字を超えるあいまい検索クエリの場合も、`LinearIndex`の`bitap`アルゴリズムが使用されます。ただし、短いあいまい検索の場合、`GPULinearIndex`はGPUで`bitap`アルゴリズムを実行することで処理を高速化します。インデックス中の各文字位置単位で並列検索スレッドを生成し、クエリ長全体にわたって`bitap`アルゴリズムを用いた検索を実行します。この実装はWebGPUを活用し、`wgsl`で記述されます。

### HybridTrieBigramInvertedIndex

`HybridTrieBigramInvertedIndex`は、文字を2つのグループに分類します。1つは、分かち書きが難しい日本語などの言語で、もう1つは、単語がスペースで自然に区切られている英語のような言語です。各カテゴリには異なるインデックス作成方法が使われます。英語の場合、標準の単語ベースの転置インデックスが使用されます。英語の転置インデックスはTrieで構築されます。一方、日本語や同様の言語の場合、分かち書きなしで文を断片化することによって、バイグラムの転置インデックスを作ります。

n-グラムのnを増やす（たとえば、Trigramを使用する）と検索ノイズを減らすことができますが、インデックスサイズも増えます。精度と効率のバランスを考え、バイグラムを採用しました。

### 前処理

前処理は最低限のことだけを行っています。
- **Unicode正規化（NFKC）**
- **小文字化**
- **日本語テキストの基本的な正規化**

転置インデックスの場合、ストップワードとステミングは、言語中立性を維持するために使用されません。さらに、複数のコードポイントで構成されるグラフェム（例：絵文字）の場合、インデックス作成のために最初のコードポイントのみが抽出されます。

`HybridTrieBigramInvertedIndex`の場合、前処理が追加で実行されます。
- 記号と句読点、約物は削除され、区切り文字として使用されます
- 空白によるトークン化
- 分かち書きができない言語（例：日本語）と、できる言語（例：英語）のふるい分け

その結果、記号は検索できず、URLはドットやコロンなどで分割されます。言語に依存しない分かち書きが利用可能だと良いのですが、現在のところは不完全です。
`Intl.Segmenter()`は日本語や中国語などの言語に対して部分的に分かち書きができます。今後の改良に期待です。

### 代替アルゴリズムの検討

いくつかの代替アルゴリズムを検討しましたが、最終的には効率が悪く採用しませんでした。

1. **ブルームフィルター**
   - ブルームフィルターは偽陰性を減らすのに効果的ですが、使用されるハッシュ関数の数に比例してポスティングリストのサイズが増加しました。
   - 2〜3個のハッシュ関数の最適な構成でも、結果として生じるインデックスサイズは非常に大きくなりました。

2. **LSH、MinHash、及び埋め込み**
   - これらのアプローチはセマンティック検索があり得ますが、あいまい検索には不向きです。
   - スペルミスのある単語は事実上新しい辞書エントリになり、次元が増大するため、実質あいまい検索ができません。
   - 次元削減技術を使用しても、ベクトル化された表現はあいまいな単語の類似性を正確に捉えることは難しいと考えました。

セマンティック検索は面白そうな方向性ですが、その実装にはサーバーサイドの実装が必要であり、クライアントサイドの静的サイト検索エンジンには不向きです。
今後はこの機能をより詳細に検討する可能性はあります。
