# staticseek: 静的サイト向けの軽量で高速な全文検索エンジン

staticseekの詳しい使い方は、[オフィシャルサイト](https://staticseek.lulliecat.com/)をご覧ください。

このパッケージはNode.js v22を利用して開発しています。
staticseekをビルドするには以下のコマンドを実行してください。

```shell
git clone https://github.com/osawa-naotaka/staticseek.git
cd staticseek
npm install
npm run build
```

`dist`ディレクトリにビルド結果のJavaScriptファイルが生成されます。
また、`npm run dev`コマンドを実行することで、アプリケーションやベンチマークを実行できます。`index.html`のコメントをご覧ください。

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
- 静的サイトジェネレーター（SSG）とのシームレスな統合

## クイックスタート

最初に、staticseekをインストールします。

```shell
npm install staticseek
```

もしくは、[jsDelivrが提供しているCDNサービス](https://www.jsdelivr.com/package/npm/staticseek)を利用して
staticseekを直接インポートします。

次に、検索機能を使いたいプロジェクトにstaticseekをインポートし、インデックスの作成と検索を実行します。
ここで、`array_of_articles`は、検索対象のテキストが含まれたJavascriptオブジェクトの配列とします。

```javascript
import { LinearIndex, createIndex, search, StaticSeekError } from "staticseek";

// インデックスを作成
const index = createIndex(LinearIndex, array_of_articles);
if(index instanceof StaticSeekError) throw index;

// 検索を実行
const result = await search(index, "検索語");
if(result instanceof StaticSeekError) throw result;
for(const r of result) {
  console.log(array_of_articles[r.id]);
}
```

検索結果は配列として得られ、スコア（一致度）によりソートされています。
検索結果のidフィールドに、ヒットした文章の配列位置が格納されています。

WebGPUを使い検索を高速化するには、以下のようにします。インデックス作成後の使い方は上記と同じです。

```javascript
import { GPULinearIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(GPULinearIndex, array_of_articles);
...
```

性能に問題がある場合は、検索速度に特化したインデックスをご使用ください。

```javascript
import { HybridTrieBigramInvertedIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(HybridTrieBigramInvertedIndex, array_of_articles);
...
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
     - CJK言語の擬陽性(検索結果に無関係な結果が表示される)が増える
     - CJK言語のあいまい検索の精度が低い
     - 検索結果のメタデータが限られている

## 検索速度・インデックス作成速度

適切なインデックスを選ぶことにより、一般的な検索時間は数msに収まります。
4MBのデータセット（約100記事、ワーストケース、最も遅いインデックスを利用の場合）の検索速度は概ね以下の通りです。

- 完全一致: < 5ms
- あいまい検索: < 150ms
- インデックス生成: ~1s
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
