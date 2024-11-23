import type { DocId, LinearIndex, BigramIndex, NgramIndex } from "@src/types";
import { wikipedia_keyword_ja } from "@test/wikipedia_keyword.ja";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { calculateJsonSize } from "@src/util";
import { docToLinearIndex, searchLinear } from "@src/linear";
import { docToBigramIndex, searchBigram } from "@src/bigram";
import { docToNgramIndex,  searchNgram  } from "@src/ngram";

function benchmark(fn: (args: any) => any, args: any[]) {
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

function execBenchmark<T extends Object>(
    index_fn:  (idx: number, contents: string[], index: T) => T,
    search_fn: (text: string, index: T) => DocId[],
    index: T,
    keywords: string[],
    articles: WikipediaArticle[]) : string[] {

    console.log("creating index...");

    const result_create_index = benchmark(() =>
        articles.map((x, idx) => index_fn(idx, [x.title, x.content], index)),
        [""]);
    
    console.log(`time: ${result_create_index.time}`);
    console.log(`index size in byte: ${calculateJsonSize(index)}`);

    console.log("begin benchmark...");
    const result_search = benchmark((key) =>
        search_fn(key, index), keywords);
    console.log(`time: ${result_search.time}`);

    return result_search.results;
}


const num_keywords = 10000;
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
console.log(ref_results);

// 8-bit bigram
console.log("8BIT BIGRAM SEARCH");
const bigram8bit_index : BigramIndex = {};
const bigram8bit_results = execBenchmark<BigramIndex>(docToBigramIndex, searchBigram, bigram8bit_index, keywords, wikipedia_articles_ja);
console.log(bigram8bit_results);

// normal bigram
console.log("NORMAL BIGRAM SEARCH");
const bigram_index : NgramIndex = {};
const bigram_results = execBenchmark<NgramIndex>(
    (docid, contents, index) => docToNgramIndex(2, false, docid, contents, index),
    (query, index) => searchNgram(2, query, index),
    bigram_index, keywords, wikipedia_articles_ja);
console.log(bigram_results);
