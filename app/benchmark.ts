import type { HybridIndex, SearcherSet } from "@src/common";
import type { LinearIndex } from "@src/linear";
import type { RecordIndex } from "@src/record";
import type { TrieIndex } from "@src/trie";
import type { SortedArrayIndex } from "@src/sortedarray";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { calculateJsonSize } from "@src/util";
import { generateIndexFn, generateSearchFn, generateHybridIndexFn, generateHybridPostprocessFn, generateHybridSearchFn, noPostProcess, tokenIsTerm, intersectAll } from "@src/common";
import { addToLinearIndex, searchLinear } from "@src/linear";
import { generateNgram, generateNgramTrie } from "@src/algo";
import { addToTrieIndex, searchTrie } from "@src/trie";
import { addToRecordIndex, searchExactRecord, searchForwardRecord } from "@src/record";
import { addToSortedArrayIndex, createSortedArrayIndex, searchExactSortedArray, searchForwardSortedArray, searchFuzzySortedArray } from "@src/sortedarray";
import { execBenchmark, generateBenchmarkRunner } from "@app/benchmark_common";


import { getAllKeywords } from "@app/benchmark_common";
import type { WikipediaArticle, WikipediaKeyword } from "@app/benchmark_common";

async function runAll(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[]) {
    console.log("initializing benchmark...");
    const keywords = getAllKeywords(wikipedia_keyword);
    console.log(`select all ${keywords.length} keywords...`);
    console.log("selected keywords are:");
    console.log(keywords);
    
    // article size
    console.log("articles size: " + calculateJsonSize(wikipedia_articles));
    
    // linear search
    console.log("LINEAR SEARCH");
    const linear_set : SearcherSet<LinearIndex> = {
        index_fn: addToLinearIndex,
        post_fn: noPostProcess,
        search_fn: searchLinear,
        index: []
    };
    const ref_results = await execBenchmark(linear_set, keywords, wikipedia_articles);
    console.log(ref_results);

    // prepare benchmark runner
    const runner = generateBenchmarkRunner(wikipedia_articles, keywords, ref_results);

    // bigram
    const bigram_set: SearcherSet<RecordIndex> = {
        index_fn: generateIndexFn(addToRecordIndex, (x) => generateNgramTrie(2, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchExactRecord, (x) => generateNgram(2, x), intersectAll),
        index: {}
    }
    await runner("BIGRAM RECORD", bigram_set);
    
    // trigram
    const trigram_set: SearcherSet<RecordIndex> = {
        index_fn: generateIndexFn(addToRecordIndex, (x) => generateNgramTrie(3, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchExactRecord, (x) => generateNgram(3, x), intersectAll),
        index: {}
    }
    await runner("TRIGRAM RECORD", trigram_set);
    
    // quadgram
    const quadgram_set: SearcherSet<RecordIndex> = {
        index_fn: generateIndexFn(addToRecordIndex, (x) => generateNgramTrie(4, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchExactRecord, (x) => generateNgram(4, x), intersectAll),
        index: {}
    }
    await runner("QUADGRAM RECORD", quadgram_set);
    
    // Trie trigram
    const trie_trigram_set: SearcherSet<TrieIndex> = {
        index_fn: generateIndexFn(addToTrieIndex, (x) => generateNgramTrie(3, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchTrie, (x) => generateNgram(3, x), intersectAll),
        index: {refs: [], children: {}}
    }
    await runner("TRIGRAM TRIE", trie_trigram_set);

    // Hybrid: en record, ja bigram record
    const hybrid_record_bigram_set: SearcherSet<HybridIndex<RecordIndex, RecordIndex>> = {
        index_fn: generateHybridIndexFn(
            addToRecordIndex, (x) => generateNgramTrie(2, x),
            addToRecordIndex, tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(noPostProcess, noPostProcess),
        search_fn: generateHybridSearchFn(
            searchExactRecord, (x) => generateNgram(2, x), intersectAll,
            searchForwardRecord, tokenIsTerm, intersectAll
        ),
        index: { ja: { }, en: { } }
    }
    const hybrid_record_bigram_result = await runner("HYBRID en:RECORD ja:BIGRAM RECORD", hybrid_record_bigram_set);
    console.log(hybrid_record_bigram_result);
    
    // prepare benchmark runner
    const hybrid_runner = generateBenchmarkRunner(wikipedia_articles, keywords, hybrid_record_bigram_result);

    // Hybrid: en sorted arrya, ja bigram sorted array
    const hybrid_bigram_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
        index_fn: generateHybridIndexFn(
            addToSortedArrayIndex, (x) => generateNgramTrie(2, x),
            addToSortedArrayIndex, tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
        search_fn: generateHybridSearchFn(
            searchExactSortedArray, (x) => generateNgram(2, x), intersectAll,
            searchForwardSortedArray, tokenIsTerm, intersectAll
        ),
        index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] } }
    }
    await hybrid_runner("HYBRID en:SORTED-ARRAY ja:BIGRAM SORTED-ARRAY: vs RECORD", hybrid_bigram_set);

    // Hybrid: en sorted arrya, ja bigram sorted array
    const hybrid_fuzzy_bigram_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
        index_fn: generateHybridIndexFn(
            addToSortedArrayIndex, (x) => generateNgramTrie(2, x),
            addToSortedArrayIndex, tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
        search_fn: generateHybridSearchFn(
            searchExactSortedArray, (x) => generateNgram(2, x), intersectAll,
            searchFuzzySortedArray, tokenIsTerm, intersectAll
        ),
        index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] } }
    }
    await hybrid_runner("HYBRID en:FUZZY SORTED-ARRAY ja:BIGRAM SORTED-ARRAY: vs RECORD", hybrid_fuzzy_bigram_set);
}


const num_articles = 100;
console.log("JAPANESE benchmark.");
await runAll(wikipedia_ja_extracted.slice(0, num_articles), wikipedia_ja_keyword);
