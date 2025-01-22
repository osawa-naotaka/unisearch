import { test, expect, describe } from "vitest";
import { array_of_articles } from "@test/array_of_articles.js";
import { LinearIndex, createIndex, search, UniSearchError, HybridBigramInvertedIndex } from "../dist/unisearch.js";
import type { UniSearchIndex } from "../dist/unisearch.js";
import { createIndexFromObject, indexToObject } from "../dist/unisearch.js";

describe("basic Linear index creation and search", async () => {
    const index: UniSearchIndex | UniSearchError  = createIndex(LinearIndex, array_of_articles);

    if(index instanceof UniSearchError) throw index;
    const result1 = await search(index, "maintainability");
    test("matches single english article", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: undefined,
                score: 0.13830942998767318,
                refs: [
                    {
                        token: "maintainability",
                        path: "content",
                        pos: 142,
                        wordaround: "ng development. this improves the reliability and maintainability of codebases. typescript is widely used in modern",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result2 = await search(index, "概要");
    test("matches multiple japanese articles, including fuzzy match", () => 
        expect(result2).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 1.0265843206468688,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 5,
                        wordaround: "react概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 6,
                        wordaround: "reactの概要",
                        distance: 0,
                    },
                ],
            },
            {
                id: 9,
                key: undefined,
                score: 0.8623308293433698,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 6,
                        wordaround: "nodejs概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 8,
                        wordaround: "node.jsの概要",
                        distance: 0,
                    },
                ],
            },
            {
                id: 6,
                key: undefined,
                score: 0.016519747688570303,
                refs: [
                    {
                        token: "概要",
                        path: "content",
                        pos: 20,
                        wordaround: "javascriptはウェブ開発で非常に重要な役割を果たしています。ユーザーとのインタラクションを可能にし、リアルタイムな更新やアニメーションの",
                        distance: 1,
                    },
                ],
            },
        ])
    );

    const result3 = await search(index, "概");
    test("matches multiple japanese articles, disable fuzzy match due to single letter query", () =>
        expect(result3).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 0.5903498583015899,
                refs: [
                    {
                        token: "概",
                        path: "slug",
                        pos: 5,
                        wordaround: "react概要",
                        distance: 0,
                    },
                    {
                        token: "概",
                        path: "data.title",
                        pos: 6,
                        wordaround: "reactの概要",
                        distance: 0,
                    },
                ],
            },
            {
                id: 9,
                key: undefined,
                score: 0.4958938809733356,
                refs: [
                    {
                        token: "概",
                        path: "slug",
                        pos: 6,
                        wordaround: "nodejs概要",
                        distance: 0,
                    },
                    {
                        token: "概",
                        path: "data.title",
                        pos: 8,
                        wordaround: "node.jsの概要",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("basic Linear index with array of strings.", async () => {
    const index = createIndex(LinearIndex, ["typescript", "javascript", "static", "型", "ライブラリ", "フロントエンド"]);

    if(index instanceof UniSearchError) throw index;
    const result1 = await search(index, "javascript");
    test("matches single english word", () => 
        expect(result1).toStrictEqual([
            {
                id: 1,
                key: undefined,
                score: 2.0986122886681096,
                refs: [
                    {
                        token: "javascript",
                        path: "",
                        pos: 0,
                        wordaround: "javascript",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("index with key_field", async () => {
    const index = createIndex(LinearIndex, array_of_articles, {key_fields: ['slug', 'data.title']})
    if(index instanceof UniSearchError) throw index;
    const result1 = await search(index, "maintainability");
    test("matches single english article", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: { slug: "typescript-guide", "data.title": "TypeScript Guide" },
                score: 0.13830942998767318,
                refs: [
                    {
                        token: "maintainability",
                        path: "content",
                        pos: 142,
                        wordaround: "ng development. this improves the reliability and maintainability of codebases. typescript is widely used in modern",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("index with search_targets", async () => {
    const index = createIndex(LinearIndex, array_of_articles, {search_targets: ['data.title','data.description','data.tags']});
    if(index instanceof UniSearchError) throw index;
    const result1 = await search(index, "maintainability");
    test("no match", () => 
        expect(result1).toStrictEqual([])
    );

    const result2 = await search(index, "概要");
    test("matches multiple japanese articles, only for few fileds", () => 
        expect(result2).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 0.550993201081484,
                refs: [
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 6,
                        wordaround: "reactの概要",
                        distance: 0,
                    },
                ],
            },
            {
                id: 9,
                key: undefined,
                score: 0.4407945608651872,
                refs: [
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 8,
                        wordaround: "node.jsの概要",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("index to object, stringify, json, re-create index.", async () => {
    const index = createIndex(LinearIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const json = JSON.stringify(indexToObject(index));
    const re_index = createIndexFromObject(JSON.parse(json));
    if(re_index instanceof UniSearchError) throw re_index;

    const result1 = await search(re_index, "maintainability");
    test("matches single english article", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: undefined,
                score: 0.13830942998767318,
                refs: [
                    {
                        token: "maintainability",
                        path: "content",
                        pos: 142,
                        wordaround: "ng development. this improves the reliability and maintainability of codebases. typescript is widely used in modern",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("fuzzy search, distance 2.", async () => {
    const index = createIndex(LinearIndex, array_of_articles, {distance: 2});
    if(index instanceof UniSearchError) throw index;

    const result1 = await search(index, "maintaibility");
    test("matches single english article, distance=2", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: undefined,
                score: 0.03995605755199447,
                refs: [
                    {
                        token: "maintaibility",
                        path: "content",
                        pos: 144,
                        wordaround: " development. this improves the reliability and maintainability of codebases. typescript is widely used in modern",
                        distance: 2,
                    },
                ],
            },
        ])
    );

    const result2 = await search(index, "概要");
    test("matches multiple japanese articles, setting is distance=2, but distance is reduced to 1 due to keyword length", () => 
        expect(result2).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 1.0265843206468688,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 5,
                        wordaround: "react概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 6,
                        wordaround: "reactの概要",
                        distance: 0,
                    },
                ],
            },
            {
                id: 9,
                key: undefined,
                score: 0.8623308293433698,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 6,
                        wordaround: "nodejs概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 8,
                        wordaround: "node.jsの概要",
                        distance: 0,
                    },
                ],
            },
            {
                id: 6,
                key: undefined,
                score: 0.016519747688570303,
                refs: [
                    {
                        token: "概要",
                        path: "content",
                        pos: 20,
                        wordaround: "javascriptはウェブ開発で非常に重要な役割を果たしています。ユーザーとのインタラクションを可能にし、リアルタイムな更新やアニメーションの",
                        distance: 1,
                    },
                ],
            },
        ])
    );
});

describe("fuzzy search, distance 0.", async () => {
    const index = createIndex(LinearIndex, array_of_articles, {distance: 0});
    if(index instanceof UniSearchError) throw index;

    const result2 = await search(index, "概要");
    test("matches multiple japanese articles", () => 
        expect(result2).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 1.1806997166031798,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 5,
                        wordaround: "react概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 6,
                        wordaround: "reactの概要",
                        distance: 0,
                    },
                ],
            },
            {
                id: 9,
                key: undefined,
                score: 0.9917877619466712,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 6,
                        wordaround: "nodejs概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 8,
                        wordaround: "node.jsの概要",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("exact search, distance 2.", async () => {
    const index = createIndex(LinearIndex, array_of_articles, {distance: 2});
    if(index instanceof UniSearchError) throw index;

    const result2 = await search(index, '"概要"');
    test("matches multiple japanese articles", () => 
        expect(result2).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 1.1806997166031798,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 5,
                        wordaround: "react概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 6,
                        wordaround: "reactの概要",
                        distance: 0,
                    },
                ],
            },
            {
                id: 9,
                key: undefined,
                score: 0.9917877619466712,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 6,
                        wordaround: "nodejs概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 8,
                        wordaround: "node.jsの概要",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("and search", async () => {
    const index = createIndex(LinearIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result2 = await search(index, "概要 ユーザーインターフェース");
    test("matches single japanese article", () => 
        expect(result2).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 1.3036927715248263,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        pos: 5,
                        wordaround: "react概要",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        pos: 6,
                        wordaround: "reactの概要",
                        distance: 0,
                    },
                    {
                        token: "ユーザーインターフェース",
                        path: "content",
                        pos: 6,
                        wordaround: "reactはユーザーインターフェースを構築するためのjavascriptライブラリです。コンポーネントベースの設計により、開発者は再利用",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("not search", async () => {
    const index = createIndex(LinearIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result2 = await search(index, "概要 react -スケーラブル");
    test("matches single japanese article", () => 
        expect(result2).toStrictEqual([
            {
                id: 6,
                key: undefined,
                score: 0.06416459750140764,
                refs: [
                    {
                        token: "概要",
                        path: "content",
                        pos: 20,
                        wordaround: "javascriptはウェブ開発で非常に重要な役割を果たしています。ユーザーとのインタラクションを可能にし、リアルタイムな更新やアニメーションの",
                        distance: 1,
                    },
                    {
                        token: "react",
                        path: "content",
                        pos: 85,
                        wordaround: "ーザーとのインタラクションを可能にし、リアルタイムな更新やアニメーションの実現を支援します。さらに、reactやvue.jsなどのフレームワークにも使用されます。",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("or search", async () => {
    const index = createIndex(LinearIndex, array_of_articles, {key_fields: ["slug"]});
    if(index instanceof UniSearchError) throw index;

    const result2 = await search(index, 'デザイン OR インタラクション');
    test("matches multiple japanese articles", () => 
        expect(result2).toStrictEqual([
            {
                id: 6,
                key: { slug: "javascript基本" },
                score: 0.1799612353402828,
                refs: [
                    {
                        token: "インタラクション",
                        path: "content",
                        pos: 40,
                        wordaround: "javascriptはウェブ開発で非常に重要な役割を果たしています。ユーザーとのインタラクションを可能にし、リアルタイムな更新やアニメーションの実現を支援します。さらに、reactやvue.jsな",
                        distance: 0,
                    },
                ],
            },
            {
                id: 5,
                key: { slug: "html-css入門" },
                score: 0.12136920522949304,
                refs: [
                    {
                        token: "デザイン",
                        path: "content",
                        pos: 40,
                        wordaround: "htmlとcssはウェブサイト作成の基礎であり、htmlが構造を提供し、cssがデザインを担当します。これらを習得することで、魅力的で使いやすいウェブページを作成できます。",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("from: search", async () => {
    const index = createIndex(LinearIndex, array_of_articles, { field_names: { link: "slug" } });
    if(index instanceof UniSearchError) throw index;

    const result1 = await search(index, "from:link guide");
    test("matches single english article", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: undefined,
                score: 0.8154493476356564,
                refs: [
                    {
                        token: "guide",
                        path: "slug",
                        pos: 11,
                        wordaround: "typescript-guide",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("from: weight: search", async () => {
    const index = createIndex(LinearIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result1 = await search(index, "from:slug weight:2.5 guide");
    test("matches single english article", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: undefined,
                score: 0.8154493476356564 * 2.5,
                refs: [
                    {
                        token: "guide",
                        path: "slug",
                        pos: 11,
                        wordaround: "typescript-guide",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("Hybrid bigram inverted index creation and search", async () => {
    const index = createIndex(HybridBigramInvertedIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result1 = await search(index, "maintainability");
    test("matches single english article", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: undefined,
                score: 1,
                refs: [
                    {
                        token: "maintainability",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result2 = await search(index, "maintaiability");
    test("matches single english article, include fuzzy match", () => 
        expect(result2).toStrictEqual([
            {
                id: 2,
                key: undefined,
                score: 1,
                refs: [
                    {
                        token: "maintainability",
                        path: "content",
                        distance: 1,
                    },
                ],
            },
        ])
    );

    const result3 = await search(index, "aintainability");
    test("no match in spite of fuzzy match, distance is 1. because the first letter is not matched.", () => 
        expect(result3).toStrictEqual([])
    );

    const result4 = await search(index, "概");
    test("matches multiple japanese articles, single letter query", () => 
        expect(result4).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 2,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        distance: 0,
                    },
                ],
            },
            {
                id: 9,
                key: undefined,
                score: 2,
                refs: [
                    {
                        token: "概要",
                        path: "slug",
                        distance: 0,
                    },
                    {
                        token: "概要",
                        path: "data.title",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result5 = await search(index, "再利用可能");
    test("matches single japanese article, all bigram matches", () => 
        expect(result5).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 4,
                refs: [
                    {
                        token: "再利",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "利用",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "用可",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "可能",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("Hybrid bigram inverted index fuzzy search", async () => {
    const index = createIndex(HybridBigramInvertedIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result1 = await search(index, "再用可能");
    test("matches multiple japanese articles, one letter deletion, one or two bigrams not matched", () => 
        expect(result1).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 2,
                refs: [
                    {
                        token: "用可",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "可能",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
            {
                id: 6,
                key: undefined,
                score: 1,
                refs: [
                    {
                        token: "可能",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result2 = await search(index, "再利不用可能");
    test("matches single japanese article, one letter appearance, two bigrams not matched", () => 
        expect(result2).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 3,
                refs: [
                    {
                        token: "再利",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "用可",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "可能",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result3 = await search(index, "再利要可能");
    test("matches single japanese article, one letter replacement, two bigrams not matched", () => 
        expect(result3).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 2,
                refs: [
                    {
                        token: "再利",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "可能",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result4 = await search(index, "再利要可脳");
    test("no match, due to two characters are replaced", () => 
        expect(result4).toStrictEqual([])
    );

    const result5 = await search(index, "distance:2 再利要可脳");
    test("matches single japanese article, two letter replacement, distance is 2", () => 
        expect(result5).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 1,
                refs: [
                    {
                        token: "再利",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result6 = await search(index, "distance:2 再李用科能");
    test("no match, two characters are replaced, in spite of distance:2", () => 
        expect(result6).toStrictEqual([])
    );

    const result7 = await search(index, "distance:2 再利用科脳");
    test("matches single japanese article, two letter replacement, distance is 2", () => 
        expect(result7).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 2,
                refs: [
                    {
                        token: "再利",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "利用",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("Hybrid bigram inverted index fuzzy search, with alphabet and kanji", async () => {
    const index = createIndex(HybridBigramInvertedIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result1 = await search(index, "再利用可能 j");
    test("matches single japanese article, with alphabet and kanji", () => 
        expect(result1).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 5,
                refs: [
                    {
                        token: "再利",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "利用",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "用可",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "可能",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "javascript",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result2 = await search(index, "再利j用可能");
    test("matches single japanese article, with alphabet is in the middle of the kanji query", () => 
        expect(result2).toStrictEqual([
            {
                id: 7,
                key: undefined,
                score: 4,
                refs: [
                    {
                        token: "再利",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "javascript",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "用可",
                        path: "content",
                        distance: 0,
                    },
                    {
                        token: "可能",
                        path: "content",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

