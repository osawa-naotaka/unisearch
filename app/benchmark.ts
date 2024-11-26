import type { DocId, LinearIndex, NgramIndex, TrieIndex, HybridIndex, BloomIndex, IndexFn, SearchFn, InvertedIndex } from "@src/types";
import { wikipedia_keyword_ja } from "@test/wikipedia_keyword.ja";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { wikipedia_keyword_en } from "@test/wikipedia_keyword.en";
import { wikipedia_articles_en } from "@test/wikipedia_articles.en";
import { calculateJsonSize, intersect, difference, zipWith3, calculateGzipedJsonSize } from "@src/util";
import { docToLinearIndex, searchLinear } from "@src/linear";
import { docToNgramIndex,  searchNgram, generate1ToNgram, generateNgram, generateNgramTrie } from "@src/ngram";
import { docToTrieIndex, searchTrie } from "@src/trie";
import { docToBloomIndex, searchBloom } from "@src/bloom";
import { generateIndexFn, generateSearchFn, generateHybridIndexFn, generateHybridSearchFn } from "@src/common";
import { docToInvertedIndex, searchInvertedIndex } from "@src/invertedindex";

type BenchmarkResult<T> = {
    time: number,
    results: T[]
}

type WikipediaKeyword = {
    title: string,
    keywords: string[]
}

type WikipediaArticle = {
    title: string,
    content: string
}

type SearchCorrectness<T> = {
    keyword: string,
    match: T,
    false_positive: T,
    false_negative: T
}

type Results = number[][];

function benchmark<T, R>(fn: (args: T, idx: number) => R, args: T[]) : BenchmarkResult<R> {
    const start = performance.now();
    const results = args.map((arg, idx) => fn(arg, idx));
    const end = performance.now();
    return {
        time: end - start,
        results: results
    };
}

function getAllKeywords(keyword_array: WikipediaKeyword[]): string[] {
    return keyword_array.flatMap(k => k.keywords);
}

async function execBenchmark<T extends Object> (
    index_fn: IndexFn<T>,
    search_fn: SearchFn<T>,
    index: T,
    keywords: string[],
    articles: WikipediaArticle[]) : Promise<DocId[][]> {

    console.log("creating index...");

    const result_create_index = benchmark((doc, docid) => {
        index_fn(docid, doc.title, index);
        index_fn(docid, doc.content, index);
    }, articles);
    
    console.log(`time: ${result_create_index.time}`);
    console.log(`index size in byte: ${calculateJsonSize(index)} byte`);
    console.log(`gziped index size in byte: ${await calculateGzipedJsonSize(index)} byte`);

    console.log("begin benchmark...");
    const result_search = benchmark((key) =>
        search_fn(key, index), keywords);
    console.log(`time: ${result_search.time} ms`);

    return result_search.results;
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

async function prepareAndExecBenchmark<T extends Object>(
    name: string,
    articles: WikipediaArticle[],
    keywords: string[],
    ref_results: Results,
    index_fn: IndexFn<T>,
    search_fn: SearchFn<T>,
    index: T
) : Promise<Results> {
    console.log(`${name} SEARCH`);
    const results = await execBenchmark<T>(index_fn, search_fn, index, keywords, articles);
    console.log(zipWith3(keywords, ref_results, results, checkResult));
    console.log(countResults(zipWith3(keywords, ref_results, results, checkResult)));

    return results;
}


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
    const linear_index : LinearIndex = [];
    const ref_results = await execBenchmark(docToLinearIndex, generateSearchFn(searchLinear), linear_index, keywords, wikipedia_articles);

    // normal bigram
    const bigram_index : NgramIndex = {};
    await prepareAndExecBenchmark(
        "NORMAL BIGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToNgramIndex, (x) => generate1ToNgram(2, x)),
        generateSearchFn(searchNgram, (x) => generateNgram(2, x)),
        bigram_index
    );
    
    // normal trigram
    const trigram_index : NgramIndex = {};
    await prepareAndExecBenchmark(
        "NORMAL TRIGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToNgramIndex, (x) => generate1ToNgram(3, x)),
        generateSearchFn(searchNgram, (x) => generateNgram(3, x)),
        trigram_index
    );
    
    // normal quadgram
    const quadgram_index : NgramIndex = {};
    await prepareAndExecBenchmark(
        "NORMAL QUADGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToNgramIndex, (x) => generate1ToNgram(4, x)),
        generateSearchFn(searchNgram, (x) => generateNgram(4, x)),
        quadgram_index
    );
    
    // Trie: normal trigram
    const trie_trigram_index : TrieIndex = {ids: [], children: {}};
    await prepareAndExecBenchmark(
        "TRIE NORMAL TRIGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToTrieIndex, (x) => generateNgramTrie(3, x)),
        generateSearchFn(searchTrie, (x) => generateNgram(3, x)),
        trie_trigram_index
    );
    
    // Hybrid: inverted index, normal bigram
    const hybrid_bigram_index : HybridIndex<NgramIndex, InvertedIndex> = { ja: {}, en: {} };
    await prepareAndExecBenchmark(
        "HYBRID INVERTED-INDEX NORMAL-BIGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateHybridIndexFn(
            docToNgramIndex, (x) => generateNgram(2, x),
            docToInvertedIndex, (x) => [x],
        ),
        generateHybridSearchFn(
            searchNgram, (x) => generateNgram(2, x),
            searchInvertedIndex, (x) => [x]
        ),
        hybrid_bigram_index
    );

    // bloom quadgram
    const bloom_quadgram_index : BloomIndex = {index: {}, bits: 1024*128, hashes: 2};
    await prepareAndExecBenchmark(
        "BLOOM QUADGRAM",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(docToBloomIndex, (x) => generate1ToNgram(4, x)),
        generateSearchFn(searchBloom, (x) => generateNgram(4, x)),
        bloom_quadgram_index
    );
}

async function runBloom() {
    console.log("LINEAR SEARCH");
    const linear_index : LinearIndex = [];
    const ref_results = await execBenchmark(docToLinearIndex, generateSearchFn(searchLinear), linear_index, getAllKeywords(wikipedia_keyword_ja), wikipedia_articles_ja);
    
    async function bloomSim(bits: number, hashes: number, articles: WikipediaArticle[], keywords: string[], ) {
        const bloom_index : BloomIndex = {index: {}, bits: bits, hashes: hashes};
        await prepareAndExecBenchmark(`bloom filter bits = ${bits}, hashes = ${hashes}`,
            articles, keywords, ref_results,
            generateIndexFn(docToBloomIndex, (x) => generate1ToNgram(4, x)),
            generateSearchFn(searchBloom, (x) => generateNgram(4, x)), bloom_index
        );
    }
    
    for(let hashes = 1; hashes < 4; hashes++) {
        for(let bits = 1024; bits < 512 * 1024; bits = bits * 2) {
            await bloomSim(bits, hashes, wikipedia_articles_ja, getAllKeywords(wikipedia_keyword_ja));
        }
    }    
}

console.log("JAPANESE test.");
await runAll(wikipedia_articles_ja, wikipedia_keyword_ja);
console.log("ENGLISH test.");
await runAll(wikipedia_articles_en, wikipedia_keyword_en);
