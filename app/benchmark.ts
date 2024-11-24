import type { DocId, LinearIndex, BigramIndex, NgramIndex, TrieIndex, HybridIndex } from "@src/types";
import { wikipedia_keyword_ja } from "@test/wikipedia_keyword.ja";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { calculateJsonSize, intersect, difference, zipWith3 } from "@src/util";
import { docToLinearIndex, searchLinear } from "@src/linear";
import { docToBigramIndex, searchBigram } from "@src/bigram";
import { docToNgramIndex,  searchNgram, generateNgramForIndex, generateNgramForSearch } from "@src/ngram";
import { invertedIndexaLikeToTrieIndex, searchTrie } from "@src/trie";
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

const num_keywords = 1000;
console.log("initializing benchmark...");
console.log(`select random ${num_keywords} keywords...`);
const keywords = getRandomKeywords(num_keywords, wikipedia_keyword_ja);
console.log("selected keywords are:");
console.log(keywords);    

// article size
console.log("articles size: " + calculateJsonSize(wikipedia_articles_ja))

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


// Trie: normal trigram
console.log("TRIE NORMAL TRIGRAM SEARCH");
const trie_trigram_index = invertedIndexaLikeToTrieIndex(trigram_index);
const trie_trigram_results = execBenchmark<TrieIndex>(
    () => trie_trigram_index,
    (query, index) => searchTrie(trigram_search_fn, query, index),
    trie_trigram_index, keywords, wikipedia_articles_ja);
console.log(zipWith3(keywords, ref_results, trie_trigram_results, checkResult));
console.log(countResults(zipWith3(keywords, ref_results, trie_trigram_results, checkResult)));
