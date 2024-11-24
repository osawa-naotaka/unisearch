import type { DocId, LinearIndex, BigramIndex, NgramIndex, TrieIndex, HybridIndex } from "@src/types";
import { wikipedia_keyword_ja } from "@test/wikipedia_keyword.ja";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { wikipedia_keyword_en } from "@test/wikipedia_keyword.en";
import { wikipedia_articles_en } from "@test/wikipedia_articles.en";
import { calculateJsonSize, intersect, difference, zipWith3 } from "@src/util";
import { docToLinearIndex, searchLinear } from "@src/linear";
import { docToBigramIndex, searchBigram } from "@src/bigram";
import { docToNgramIndex,  searchNgram, generateNgramForIndex, generateNgramForSearch } from "@src/ngram";
import { invertedIndexLikeToTrieIndex, searchTrie } from "@src/trie";
import { docToHybridIndex, searchHybrid } from "@src/hybrid";

type BenchmarkResult<T> = {
    time: number,
    results: T[]
}

function benchmark<T, R>(fn: (args: T) => R, args: T[]) : BenchmarkResult<R> {
    const start = performance.now();
    const results = args.map((arg) => fn(arg))
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
    index_fn:  (idx: number, contents: string[], index: T) => T,
    search_fn: (text: string, index: T) => DocId[],
    index: T,
    keywords: string[],
    articles: WikipediaArticle[]) : DocId[][] {

    console.log("creating index...");

    const result_create_index = benchmark(() =>
        articles.map((x, idx) => index_fn(idx, [x.title, x.content], index)),
        [""]);
    
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

const num_keywords = 100;
console.log("JAPANESE test.");
console.log("initializing benchmark...");
console.log(`select random ${num_keywords} keywords...`);
const keywords = getRandomKeywords(num_keywords, wikipedia_keyword_ja);
console.log("selected keywords are:");
console.log(keywords);    

// article size
console.log("articles size: " + calculateJsonSize(wikipedia_articles_ja));

// linear search
console.log("LINEAR SEARCH");
const linear_index : LinearIndex = [];
const ref_results = execBenchmark<LinearIndex>(docToLinearIndex, searchLinear, linear_index, keywords, wikipedia_articles_ja);

// 8-bit bigram
console.log("8BIT BIGRAM SEARCH");
const bigram8bit_index : BigramIndex = {};
const bigram8bit_results = execBenchmark<BigramIndex>(docToBigramIndex, searchBigram, bigram8bit_index, keywords, wikipedia_articles_ja);
console.log(zipWith3(keywords, ref_results, bigram8bit_results, checkResult));
console.log(countResults(zipWith3(keywords, ref_results, bigram8bit_results, checkResult)));

// normal bigram
console.log("NORMAL BIGRAM SEARCH");
const bigram_index : NgramIndex = {};
const bigram_fn = (text: string) => generateNgramForIndex(2, text); 
const bigram_search_fn = (text: string) => generateNgramForSearch(2, text);
const bigram_results = execBenchmark<NgramIndex>(
    (docid, contents, index) => docToNgramIndex(bigram_fn, docid, contents, index),
    (query, index) => searchNgram(bigram_search_fn, query, index),
    bigram_index, keywords, wikipedia_articles_ja);
console.log(zipWith3(keywords, ref_results, bigram_results, checkResult));
console.log(countResults(zipWith3(keywords, ref_results, bigram_results, checkResult)));

// normal trigram
console.log("NORMAL TRIGRAM SEARCH");
const trigram_index : NgramIndex = {};
const trigram_fn = (text: string) => generateNgramForIndex(3, text); 
const trigram_search_fn = (text: string) => generateNgramForSearch(3, text); 
const trigram_results = execBenchmark<NgramIndex>(
    (docid, contents, index) => docToNgramIndex(trigram_fn, docid, contents, index),
    (query, index) => searchNgram(trigram_search_fn, query, index),
    trigram_index, keywords, wikipedia_articles_ja);
console.log(zipWith3(keywords, ref_results, trigram_results, checkResult));
console.log(countResults(zipWith3(keywords, ref_results, trigram_results, checkResult)));

// normal quadgram
console.log("NORMAL QUADGRAM SEARCH");
const quadgram_index : NgramIndex = {};
const quadgram_fn = (text: string) => generateNgramForIndex(4, text); 
const quadgram_search_fn = (text: string) => generateNgramForSearch(4, text); 
const quadgram_results = execBenchmark<NgramIndex>(
    (docid, contents, index) => docToNgramIndex(quadgram_fn, docid, contents, index),
    (query, index) => searchNgram(quadgram_search_fn, query, index),
    quadgram_index, keywords, wikipedia_articles_ja);
console.log(zipWith3(keywords, ref_results, quadgram_results, checkResult));
console.log(countResults(zipWith3(keywords, ref_results, quadgram_results, checkResult)));


// Trie: normal trigram
console.log("TRIE NORMAL TRIGRAM SEARCH");
const trie_trigram_index = invertedIndexLikeToTrieIndex(trigram_index);
const trie_trigram_results = execBenchmark<TrieIndex>(
    () => trie_trigram_index,
    (query, index) => searchTrie(trigram_search_fn, query, index),
    trie_trigram_index, keywords, wikipedia_articles_ja);
console.log(zipWith3(keywords, ref_results, trie_trigram_results, checkResult));
console.log(countResults(zipWith3(keywords, ref_results, trie_trigram_results, checkResult)));


// Hybrid: normal trigram
console.log("HYBRID NORMAL TRIGRAM SEARCH");
const hybrid_trigram_index : HybridIndex = { trie: {ids: [], children: {} }, ngram: {} };

const hybrid_trigram_results = execBenchmark<HybridIndex>(
    (docid, contents, index) => docToHybridIndex(trigram_fn, docid, contents, index),
    (query, index) => searchHybrid(trigram_search_fn, query, index),
    hybrid_trigram_index, keywords, wikipedia_articles_ja);
console.log(zipWith3(keywords, ref_results, hybrid_trigram_results, checkResult));
console.log(countResults(zipWith3(keywords, ref_results, hybrid_trigram_results, checkResult)));


// english test
console.log("ENGLISH test.");
console.log(`select random ${num_keywords} keywords...`);
const en_keywords = getRandomKeywords(num_keywords, wikipedia_keyword_en);
console.log("selected keywords are:");
console.log(en_keywords);    

// article size
console.log("articles size: " + calculateJsonSize(wikipedia_articles_en));

// linear search
console.log("LINEAR SEARCH");
const en_linear_index : LinearIndex = [];
const en_ref_results = execBenchmark<LinearIndex>(docToLinearIndex, searchLinear, en_linear_index, en_keywords, wikipedia_articles_en);


// normal trigram
console.log("NORMAL TRIGRAM SEARCH");
const en_trigram_index : NgramIndex = {};
const en_trigram_results = execBenchmark<NgramIndex>(
    (docid, contents, index) => docToNgramIndex(trigram_fn, docid, contents, index),
    (query, index) => searchNgram(trigram_search_fn, query, index),
    en_trigram_index, en_keywords, wikipedia_articles_en);
console.log(zipWith3(en_keywords, en_ref_results, en_trigram_results, checkResult));
console.log(countResults(zipWith3(en_keywords, en_ref_results, en_trigram_results, checkResult)));

// normal quadgram
console.log("NORMAL QUADGRAM SEARCH");
const en_quadgram_index : NgramIndex = {};
const en_quadgram_results = execBenchmark<NgramIndex>(
    (docid, contents, index) => docToNgramIndex(quadgram_fn, docid, contents, index),
    (query, index) => searchNgram(quadgram_search_fn, query, index),
    en_quadgram_index, en_keywords, wikipedia_articles_en);
console.log(zipWith3(en_keywords, en_ref_results, en_quadgram_results, checkResult));
console.log(countResults(zipWith3(en_keywords, en_ref_results, en_quadgram_results, checkResult)));
