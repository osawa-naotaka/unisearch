import { generateNgram, generateNgramTrie } from "@ref/algo";
import type { WikipediaArticle, WikipediaKeyword } from "@ref/bench/benchmark_common";
import { execBenchmark, generateBenchmarkRunner, getKeywords } from "@ref/bench/benchmark_common";
import type { HybridIndex, Reference, SearcherSet, SingleIndex } from "@ref/common";
import {
    generateHybridIndexFn,
    generateHybridPostprocessFn,
    generateHybridSearchFn,
    generateIndexFn,
    generatePostprocessFn,
    generateSearchFn,
    intersectAll,
    noPostProcess,
    tokenIsTerm,
} from "@ref/common";
import type { LinearIndex } from "@ref/linear";
import { addToLinearIndex, searchFuzzyLinear, searchLinear } from "@ref/linear";
import type { SortedArrayIndex } from "@ref/sortedarray";
import {
    addToSortedArrayIndex,
    createSortedArrayIndex,
    searchForwardSortedArray,
    searchFuzzySortedArray,
} from "@ref/sortedarray";
import type { TrieIndex } from "@ref/trie";
import { addToTrieIndex, searchTrie } from "@ref/trie";
import { calculateJsonSize } from "@ref/util";
import type { WasmLinearIndex } from "@ref/wasmlinear";
import { addToWasmLinearIndex, searchWasmLinear } from "@ref/wasmlinear";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { wikipedia_ja_keyword_long } from "@test/wikipedia_ja_keyword_long";
import { StringManager } from "../bitap-wasm/pkg/bitap";

async function runAll(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[], n: number) {
    console.log("initializing benchmark...");
    const keywords = getKeywords(n, wikipedia_keyword);
    console.log(`select all ${keywords.length} keywords...`);
    console.log("selected keywords are:");
    console.log(keywords);

    // article size
    console.log(`articles size: ${calculateJsonSize(wikipedia_articles)}`);

    // linear search
    console.log("LINEAR SEARCH");
    const linear_search_set: SearcherSet<SingleIndex<LinearIndex>> = {
        index_fn: (ref: Reference, text: string, index: SingleIndex<LinearIndex>) =>
            addToLinearIndex(ref, text, index.index),
        post_fn: noPostProcess,
        search_fn: (query: string, index: SingleIndex<LinearIndex>) => searchLinear(query, index.index),
        index: { index: [], numtoken: {} },
    };
    const ref_results = await execBenchmark(linear_search_set, keywords, wikipedia_articles);
    console.log(ref_results);

    // prepare benchmark runner
    const runner = generateBenchmarkRunner(wikipedia_articles, keywords, ref_results);

    // linear fuzzy search
    const linear_fuzzy_set: SearcherSet<SingleIndex<LinearIndex>> = {
        index_fn: (ref: Reference, text: string, index: SingleIndex<LinearIndex>) =>
            addToLinearIndex(ref, text, index.index),
        post_fn: noPostProcess,
        search_fn: (query: string, index: SingleIndex<LinearIndex>) => searchFuzzyLinear(query, index.index),
        index: { index: [], numtoken: {} },
    };
    await runner("LINEAR FUZZY", linear_fuzzy_set);

    // linear wasm search
    const linear_wasm_set: SearcherSet<SingleIndex<WasmLinearIndex>> = {
        index_fn: (ref: Reference, text: string, index: SingleIndex<WasmLinearIndex>) =>
            addToWasmLinearIndex(ref, text, index.index),
        post_fn: noPostProcess,
        search_fn: (query: string, index: SingleIndex<WasmLinearIndex>) => searchWasmLinear(query, index.index),
        index: { index: new StringManager(), numtoken: {} },
    };
    await runner("LINEAR WASM", linear_wasm_set);

    // bigram
    const bigram_set: SearcherSet<SingleIndex<SortedArrayIndex>> = {
        index_fn: generateIndexFn(addToSortedArrayIndex, (x) => generateNgramTrie(2, x)),
        post_fn: generatePostprocessFn(createSortedArrayIndex),
        search_fn: generateSearchFn(searchForwardSortedArray, (x) => generateNgram(2, x), intersectAll),
        index: { index: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("BIGRAM SORTED-ARRAY", bigram_set);

    // trigram
    const trigram_set: SearcherSet<SingleIndex<SortedArrayIndex>> = {
        index_fn: generateIndexFn(addToSortedArrayIndex, (x) => generateNgramTrie(3, x)),
        post_fn: generatePostprocessFn(createSortedArrayIndex),
        search_fn: generateSearchFn(searchForwardSortedArray, (x) => generateNgram(3, x), intersectAll),
        index: { index: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("TRIGRAM SORTED-ARRAY", trigram_set);

    // quadgram
    const quadgram_set: SearcherSet<SingleIndex<SortedArrayIndex>> = {
        index_fn: generateIndexFn(addToSortedArrayIndex, (x) => generateNgramTrie(4, x)),
        post_fn: generatePostprocessFn(createSortedArrayIndex),
        search_fn: generateSearchFn(searchForwardSortedArray, (x) => generateNgram(4, x), intersectAll),
        index: { index: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("QUADGRAM SORTED-ARRAY", quadgram_set);

    // Trie trigram
    const trie_trigram_set: SearcherSet<SingleIndex<TrieIndex>> = {
        index_fn: generateIndexFn(addToTrieIndex, (x) => generateNgramTrie(3, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchTrie, (x) => generateNgram(3, x), intersectAll),
        index: { index: { refs: [], children: {} }, numtoken: {} },
    };
    await runner("TRIGRAM TRIE", trie_trigram_set);

    // Hybrid: en sorted arrya, ja trigram sorted array
    const hybrid_bigram_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
        index_fn: generateHybridIndexFn(
            addToSortedArrayIndex,
            (x) => generateNgramTrie(3, x),
            addToSortedArrayIndex,
            tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
        search_fn: generateHybridSearchFn(
            searchForwardSortedArray,
            (x) => generateNgram(3, x),
            intersectAll,
            searchForwardSortedArray,
            tokenIsTerm,
            intersectAll,
        ),
        index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("HYBRID en:SORTED-ARRAY ja:TRIGRAM SORTED-ARRAY", hybrid_bigram_set);

    // Hybrid: en sorted arrya, ja trigram sorted array
    const hybrid_fuzzy_bigram_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
        index_fn: generateHybridIndexFn(
            addToSortedArrayIndex,
            (x) => generateNgramTrie(3, x),
            addToSortedArrayIndex,
            tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
        search_fn: generateHybridSearchFn(
            searchForwardSortedArray,
            (x) => generateNgram(3, x),
            intersectAll,
            searchFuzzySortedArray,
            tokenIsTerm,
            intersectAll,
        ),
        index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("HYBRID en:FUZZY SORTED-ARRAY ja:TRIGRAM SORTED-ARRAY", hybrid_fuzzy_bigram_set);
}

const num_articles = 100;
console.log("JAPANESE benchmark.");
await runAll(wikipedia_ja_extracted.slice(0, num_articles), wikipedia_ja_keyword, 20);
console.log("JAPANESE benchmark with long keyword.");
await runAll(wikipedia_ja_extracted.slice(0, num_articles), wikipedia_ja_keyword_long, 20);
