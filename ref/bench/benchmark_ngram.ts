import { generateNgram, generate1ToNgram, generateNgramTrie } from "@ref/algo";
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
import { addToLinearIndex, searchLinear } from "@ref/linear";
import type { SortedArrayIndex } from "@ref/sortedarray";
import {
    addToSortedArrayIndex,
    createSortedArrayIndex,
    searchExactSortedArray,
    searchForwardSortedArray,
} from "@ref/sortedarray";
import type { RecordIndex } from "@ref/record";
import { addToRecordIndex, searchExactRecord } from "@ref/record";
import { calculateJsonSize } from "@ref/util";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_keyword_long } from "@test/wikipedia_ja_keyword_long";
import { wikipedia_en_extracted } from "@test/wikipedia_en_extracted";
import { wikipedia_en_keyword } from "@test/wikipedia_en_keyword";

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

    // bigram sorted array
    const bigram_set: SearcherSet<SingleIndex<SortedArrayIndex>> = {
        index_fn: generateIndexFn(addToSortedArrayIndex, (x) => generateNgramTrie(2, x)),
        post_fn: generatePostprocessFn(createSortedArrayIndex),
        search_fn: generateSearchFn(searchForwardSortedArray, (x) => generateNgram(2, x), intersectAll),
        index: { index: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("BIGRAM SORTED-ARRAY", bigram_set);

    // trigram sorted array
    const trigram_set: SearcherSet<SingleIndex<SortedArrayIndex>> = {
        index_fn: generateIndexFn(addToSortedArrayIndex, (x) => generateNgramTrie(3, x)),
        post_fn: generatePostprocessFn(createSortedArrayIndex),
        search_fn: generateSearchFn(searchForwardSortedArray, (x) => generateNgram(3, x), intersectAll),
        index: { index: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("TRIGRAM SORTED-ARRAY", trigram_set);

    // quadgram sorted array
    const quadgram_set: SearcherSet<SingleIndex<SortedArrayIndex>> = {
        index_fn: generateIndexFn(addToSortedArrayIndex, (x) => generateNgramTrie(4, x)),
        post_fn: generatePostprocessFn(createSortedArrayIndex),
        search_fn: generateSearchFn(searchForwardSortedArray, (x) => generateNgram(4, x), intersectAll),
        index: { index: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("QUADGRAM SORTED-ARRAY", quadgram_set);

    // bigram record
    const bigram_record_set: SearcherSet<SingleIndex<RecordIndex>> = {
        index_fn: generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(2, x)),
        post_fn: generatePostprocessFn(noPostProcess),
        search_fn: generateSearchFn(searchExactRecord, (x) => generateNgram(2, x), intersectAll),
        index: { index: { }, numtoken: {} },
    };
    await runner("BIGRAM RECORD", bigram_record_set);

    // bigram sorted array
    const trigram_record_set: SearcherSet<SingleIndex<RecordIndex>> = {
        index_fn: generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(3, x)),
        post_fn: generatePostprocessFn(noPostProcess),
        search_fn: generateSearchFn(searchExactRecord, (x) => generateNgram(3, x), intersectAll),
        index: { index: { }, numtoken: {} },
    };
    await runner("TRIGRAM RECORD", trigram_record_set);

    // quadgram sorted array
    const quadgram_record_set: SearcherSet<SingleIndex<RecordIndex>> = {
        index_fn: generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(4, x)),
        post_fn: generatePostprocessFn(noPostProcess),
        search_fn: generateSearchFn(searchExactRecord, (x) => generateNgram(4, x), intersectAll),
        index: { index: { }, numtoken: {} },
    };
    await runner("QUADGRAM RECORD", quadgram_record_set);
}

async function runHybrid(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[], n: number) {
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

    const hybrid_bigram_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
        index_fn: generateHybridIndexFn(
            addToSortedArrayIndex,
            (x) => generateNgramTrie(2, x),
            addToSortedArrayIndex,
            tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
        search_fn: generateHybridSearchFn(
            searchExactSortedArray,
            (x) => generateNgram(2, x),
            intersectAll,
            searchExactSortedArray,
            tokenIsTerm,
            intersectAll,
        ),
        index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("HYBRID en:SORTED-ARRAY ja:BIGRAM SORTED-ARRAY", hybrid_bigram_set);

    const hybrid_bigram_record_set: SearcherSet<HybridIndex<RecordIndex, RecordIndex>> = {
        index_fn: generateHybridIndexFn(
            addToRecordIndex,
            (x) => generateNgramTrie(2, x),
            addToRecordIndex,
            tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(noPostProcess, noPostProcess),
        search_fn: generateHybridSearchFn(
            searchExactRecord,
            (x) => generateNgram(2, x),
            intersectAll,
            searchExactRecord,
            tokenIsTerm,
            intersectAll,
        ),
        index: { ja: { }, en: {  }, numtoken: {} },
    };
    await runner("HYBRID en:RECORD ja:BIGRAM RECORD", hybrid_bigram_record_set);

    const hybrid_trigram_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
        index_fn: generateHybridIndexFn(
            addToSortedArrayIndex,
            (x) => generateNgramTrie(3, x),
            addToSortedArrayIndex,
            tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
        search_fn: generateHybridSearchFn(
            searchExactSortedArray,
            (x) => generateNgram(3, x),
            intersectAll,
            searchExactSortedArray,
            tokenIsTerm,
            intersectAll,
        ),
        index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] }, numtoken: {} },
    };
    await runner("HYBRID en:SORTED-ARRAY ja:TRIGRAM SORTED-ARRAY", hybrid_trigram_set);
}

const num_articles = 100;
console.log("JAPANESE benchmark with long keyword.");
await runAll(wikipedia_ja_extracted.slice(0, num_articles), wikipedia_ja_keyword_long, 20);

console.log("English benchmark.");
await runAll(wikipedia_en_extracted.slice(0, num_articles), wikipedia_en_keyword, 20);

console.log("Hybrid JAPANESE benchmark with long keyword.");
await runHybrid(wikipedia_ja_extracted.slice(0, num_articles), wikipedia_ja_keyword_long, 20);

console.log("Hybrid English benchmark.");
await runHybrid(wikipedia_en_extracted.slice(0, num_articles), wikipedia_en_keyword, 20);
