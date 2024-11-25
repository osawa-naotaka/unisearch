import type { DocId, LinearIndex, NgramIndex, TrieIndex, HybridIndex, BloomIndex, IndexFn, SearchFn } from "@src/types";
import { wikipedia_keyword_ja } from "@test/wikipedia_keyword.ja";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { wikipedia_keyword_en } from "@test/wikipedia_keyword.en";
import { wikipedia_articles_en } from "@test/wikipedia_articles.en";
import { calculateJsonSize, intersect, difference, zipWith3 } from "@src/util";
import { docToLinearIndex, searchLinear } from "@src/linear";
import { docToNgramIndex,  searchNgram, generateNgramForIndex, generateNgramForSearch } from "@src/ngram";
import { docToTrieIndex, searchTrie } from "@src/trie";
import { docToHybridIndex, searchHybrid } from "@src/hybrid";
import { docToBloomIndex, searchBloom } from "@src/bloom";
import { generateIndexFn, generateSearchFn } from "@src/common";

type BenchmarkResult<T> = {
    time: number,
    results: T[]
}

function benchmark<T, R>(fn: (args: T, idx: number) => R, args: T[]) : BenchmarkResult<R> {
    const start = performance.now();
    const results = args.map((arg, idx) => fn(arg, idx));
    const end = performance.now();
    return {
        time: end - start,
        results: results
    };
}

let rand_state = 1;   // fixed seed
function rand() : number {
    rand_state = (rand_state * 48271) & 0x7fffffff; // positive value
    return rand_state;
}

type WikipediaKeyword = {
    title: string,
    keywords: string[]
}

type WikipediaArticle = {
    title: string,
    content: string
}

function getRandomKeywords(num: number, keyword_array: WikipediaKeyword[]) : string[] {
    const keywords = [];
    const num_entry = keyword_array.length;
    for(let i = 0; i < num; i++) {
        const entry = keyword_array[rand() % num_entry];
        const num_keywords = entry.keywords.length;
        keywords.push(entry.keywords[rand() % num_keywords])
    }
    return keywords;
}

function execBenchmark<T extends Object> (
    index_fn: IndexFn<T>,
    search_fn: SearchFn<T>,
    index: T,
    keywords: string[],
    articles: WikipediaArticle[]) : DocId[][] {

    console.log("creating index...");

    const result_create_index = benchmark((doc, docid) => {
        index = index_fn(docid, doc.title, index);
        index = index_fn(docid, doc.content, index);
    }, articles);
    
    console.log(`time: ${result_create_index.time}`);
    console.log(`index size in byte: ${calculateJsonSize(index)}`);

    console.log("begin benchmark...");
    const result_search = benchmark((key) =>
        search_fn(key, index), keywords);
    console.log(`time: ${result_search.time} ms`);

    return result_search.results;
}

type SearchCorrectness<T> = {
    keyword: string,
    match: T,
    false_positive: T,
    false_negative: T
}

function checkResult(keyword: string, correct: DocId[], test: DocId[]) : SearchCorrectness<DocId[]> {
    return {
        keyword: keyword,
        match: intersect(correct, test),
        false_positive: difference(test, correct),
        false_negative: difference(correct, test)
    };
}

function countResults(results: SearchCorrectness<DocId[]>[]) : SearchCorrectness<number> {
    const count : SearchCorrectness<number> = {
        keyword: "",
        match: 0,
        false_positive: 0,
        false_negative: 0
    };
    for(let i = 0; i < results.length; i++) {
        count.match          = count.match          + results[i].match.length;
        count.false_positive = count.false_positive + results[i].false_positive.length;
        count.false_negative = count.false_negative + results[i].false_negative.length;
    }
    return count;
}

type Results = number[][];

function prepareAndExecBenchmark<T extends Object>(
    name: string,
    articles: WikipediaArticle[],
    keywords: string[],
    ref_results: Results,
    index_fn: IndexFn<T>,
    search_fn: SearchFn<T>,
    index: T
) : Results {
    console.log(`${name} SEARCH`);
    const results = execBenchmark<T>(index_fn, search_fn, index, keywords, articles);
    console.log(zipWith3(keywords, ref_results, results, checkResult));
    console.log(countResults(zipWith3(keywords, ref_results, results, checkResult)));

    return results;
}


function runAll(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[]) {
    const num_keywords = 100;
    console.log("initializing benchmark...");
    console.log(`select random ${num_keywords} keywords...`);
    const keywords = getRandomKeywords(num_keywords, wikipedia_keyword);
    console.log("selected keywords are:");
    console.log(keywords);    
    
    // article size
    console.log("articles size: " + calculateJsonSize(wikipedia_articles));
    
    // linear search
    console.log("LINEAR SEARCH");
    const linear_index : LinearIndex = [];
    const ref_results = execBenchmark(docToLinearIndex, generateSearchFn(searchLinear), linear_index, keywords, wikipedia_articles);
    
    // normal bigram
    const bigram_index : NgramIndex = {};
    prepareAndExecBenchmark(
        "NORMAL BIGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToNgramIndex, (x) => generateNgramForIndex(2, x)),
        generateSearchFn(searchNgram, (x) => generateNgramForSearch(2, x)),
        bigram_index
    );
    
    // normal trigram
    const trigram_index : NgramIndex = {};
    prepareAndExecBenchmark(
        "NORMAL TRIGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToNgramIndex, (x) => generateNgramForIndex(3, x)),
        generateSearchFn(searchNgram, (x) => generateNgramForSearch(3, x)),
        trigram_index
    );
    
    // normal quadgram
    const quadgram_index : NgramIndex = {};
    prepareAndExecBenchmark(
        "NORMAL QUADGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToNgramIndex, (x) => generateNgramForIndex(4, x)),
        generateSearchFn(searchNgram, (x) => generateNgramForSearch(4, x)),
        quadgram_index
    );
    
    // Trie: normal trigram
    const trie_trigram_index : TrieIndex = {ids: [], children: {}};
    prepareAndExecBenchmark(
        "TRIE NORMAL TRIGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToTrieIndex, (x) => generateNgramForSearch(3, x)),
        generateSearchFn(searchTrie, (x) => generateNgramForSearch(3, x)),
        trie_trigram_index
    );
    
    // Hybrid: inverted index, normal bigram
    const hybrid_bigram_index : HybridIndex = { ngram: {}, inverted: {} };
    prepareAndExecBenchmark(
        "HYBRID INVERTED-INDEX NORMAL-BIGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToHybridIndex, (x) => generateNgramForSearch(2, x)),
        generateSearchFn(searchHybrid, (x) => generateNgramForSearch(2, x)),
        hybrid_bigram_index
    );
    
    // bloom quadgram
    const bloom_quadgram_index : BloomIndex = {index: {}, bits: 1024*64, hashes: 1};
    prepareAndExecBenchmark(
        "BLOOM QUADGRAM SEARCH",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToBloomIndex, (x) => generateNgramForIndex(4, x)),
        generateSearchFn(searchBloom, (x) => generateNgramForSearch(4, x)),
        bloom_quadgram_index
    );
}


console.log("JAPANESE test.");
runAll(wikipedia_articles_ja, wikipedia_keyword_ja);
console.log("ENGLISH test.");
runAll(wikipedia_articles_en, wikipedia_keyword_en);
