import { test, expect, describe } from "vitest";
import { array_of_articles } from "@test/array_of_articles.js";
import { LinearIndex, createIndex, search, UniSearchError, HyblidBigramInvertedIndex } from "../dist/unisearch.js";
import { UniIndex, SearchIndex, LinearIndexEntry } from "../dist/unisearch.js";
import { createIndexFromObject, indexToObject } from "../dist/unisearch.js";

describe("basic Linear index creation and search", () => {
    const index: UniIndex<SearchIndex<LinearIndexEntry>> | UniSearchError  = createIndex(LinearIndex, array_of_articles);

    if(index instanceof UniSearchError) throw index;
    const result1 = search(index, "maintainability");
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
                        wordaround: "the reliability and maintainability of codebases. types",
                        distance: 0,
                    },
                ],
            },
        ])
    );

    const result2 = search(index, "概要");
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
                        wordaround: "javascriptはウェブ開発で非常に重要な役割を果たしています。ユーザーとのイン",
                        distance: 1,
                    },
                ],
            },
        ])
    );
});

describe("basic Linear index with array of strings.", () => {
    const index = createIndex(LinearIndex, ["typescript", "javascript", "static", "型", "ライブラリ", "フロントエンド"]);

    if(index instanceof UniSearchError) throw index;
    const result1 = search(index, "javascript");
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

describe("index with key_field", () => {
    const index = createIndex(LinearIndex, array_of_articles, {key_field: 'slug'})
    if(index instanceof UniSearchError) throw index;
    const result1 = search(index, "maintainability");
    test("matches single english article", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: "typescript-guide",
                score: 0.13830942998767318,
                refs: [
                    {
                        token: "maintainability",
                        path: "content",
                        pos: 142,
                        wordaround: "the reliability and maintainability of codebases. types",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("index with key_field", () => {
    const index = createIndex(LinearIndex, array_of_articles, {key_field: 'slug'})
    if(index instanceof UniSearchError) throw index;
    const result1 = search(index, "maintainability");
    test("matches single english article", () => 
        expect(result1).toStrictEqual([
            {
                id: 2,
                key: "typescript-guide",
                score: 0.13830942998767318,
                refs: [
                    {
                        token: "maintainability",
                        path: "content",
                        pos: 142,
                        wordaround: "the reliability and maintainability of codebases. types",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("index with search_targets", () => {
    const index = createIndex(LinearIndex, array_of_articles, {search_targets: ['data.title','data.description','data.tags']});
    if(index instanceof UniSearchError) throw index;
    const result1 = search(index, "maintainability");
    test("no match", () => 
        expect(result1).toStrictEqual([])
    );

    const result2 = search(index, "概要");
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

describe("index to object, stringify, json, re-create index.", () => {
    const index = createIndex(LinearIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const json = JSON.stringify(indexToObject(index));
    const re_index = createIndexFromObject(JSON.parse(json));

    const result1 = search(re_index, "maintainability");
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
                        wordaround: "the reliability and maintainability of codebases. types",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("fuzzy search, distance 2.", () => {
    const index = createIndex(LinearIndex, array_of_articles, {distance: 2});
    if(index instanceof UniSearchError) throw index;

    const result1 = search(index, "maintaibility");
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
                        wordaround: "e reliability and maintainability of codebases. types",
                        distance: 2,
                    },
                ],
            },
        ])
    );
});

describe("fuzzy search, distance 0.", () => {
    const index = createIndex(LinearIndex, array_of_articles, {distance: 0});
    if(index instanceof UniSearchError) throw index;

    const result2 = search(index, "概要");
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

describe("exact search, distance 2.", () => {
    const index = createIndex(LinearIndex, array_of_articles, {distance: 2});
    if(index instanceof UniSearchError) throw index;

    const result2 = search(index, '"概要"');
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

describe("and search", () => {
    const index = createIndex(LinearIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result2 = search(index, "概要 ユーザーインターフェース");
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
                        wordaround: "reactはユーザーインターフェースを構築するためのjavascriptライ",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("not search", () => {
    const index = createIndex(LinearIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result2 = search(index, "概要 react -スケーラブル");
    test("matches single japanese article", () => 
        expect(result2).toStrictEqual([
            {
                id: 6,
                key: undefined,
                score: 0.07499711596179154,
                refs: [
                    {
                        token: "概要",
                        path: "content",
                        pos: 20,
                        wordaround: "javascriptはウェブ開発で非常に重要な役割を果たしています。ユーザーとのイン",
                        distance: 1,
                    },
                    {
                        token: "react",
                        path: "content",
                        pos: 85,
                        wordaround: "ニメーションの実現を支援します。さらに、reactやvue.jsなどのフレームワークにも使",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("or search", () => {
    const index = createIndex(LinearIndex, array_of_articles, {key_field: "slug"});
    if(index instanceof UniSearchError) throw index;

    const result2 = search(index, 'デザイン OR インタラクション');
    test("matches multiple japanese articles", () => 
        expect(result2).toStrictEqual([
            {
                id: 6,
                key: "javascript基本",
                score: 0.1799612353402828,
                refs: [
                    {
                        token: "インタラクション",
                        path: "content",
                        pos: 40,
                        wordaround: "重要な役割を果たしています。ユーザーとのインタラクションを可能にし、リアルタイムな更新やアニメー",
                        distance: 0,
                    },
                ],
            },
            {
                id: 5,
                key: "html-css入門",
                score: 0.12136920522949304,
                refs: [
                    {
                        token: "デザイン",
                        path: "content",
                        pos: 40,
                        wordaround: "であり、htmlが構造を提供し、cssがデザインを担当します。これらを習得することで、魅",
                        distance: 0,
                    },
                ],
            },
        ])
    );
});

describe("from: search", () => {
    const index = createIndex(LinearIndex, array_of_articles, { field_names: { link: "slug" } });
    if(index instanceof UniSearchError) throw index;

    const result1 = search(index, "from:link guide");
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

describe("from: weight: search", () => {
    const index = createIndex(LinearIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result1 = search(index, "from:slug weight:2.5 guide");
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

describe("Hybrid bigram inverted index creation and search", () => {
    const index = createIndex(HyblidBigramInvertedIndex, array_of_articles);
    if(index instanceof UniSearchError) throw index;

    const result1 = search(index, "maintainability");
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

    const result2 = search(index, "概要");
    test("matches multiple japanese articles, including fuzzy match", () => 
        expect(result2).toStrictEqual([
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
});
