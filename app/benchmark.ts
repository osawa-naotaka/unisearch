import type { Reference, IndexFn, SearchFn, HybridIndex, PostprocessFn } from "@src/common";
import type { LinearIndex } from "@src/linear";
import type { RecordIndex } from "@src/record";
import type { TrieIndex } from "@src/trie";
import type { BloomIndex } from "@src/bloom";
import { wikipedia_keyword_ja } from "@test/wikipedia_keyword.ja";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { wikipedia_keyword_en } from "@test/wikipedia_keyword.en";
import { wikipedia_articles_en } from "@test/wikipedia_articles.en";
import { calculateJsonSize, calculateGzipedJsonSize, compose, zipWith, intersect, difference } from "@src/util";
import { splitByKatakana } from "@src/preprocess";
import { generateIndexFn, generateSearchFn, generateHybridIndexFn, generateHybridSearchFn, noPostProcess } from "@src/common";
import { addToLinearIndex, searchLinear } from "@src/linear";
import { generate1ToNgram, generateNgram, generateNgramTrie } from "@src/ngram";
import { addToTrieIndex, searchTrie } from "@src/trie";
import { addToBloomIndex, searchBloom } from "@src/bloom";
import { addToRecordIndex, searchRecord } from "@src/record";
import { loadDefaultJapaneseParser } from "budoux";

type Result = {
    keyword: string,
    refs: Reference[]
};

type BenchmarkResult<R> = {
    time: number,
    results: R[]
};

type WikipediaKeyword = {
    title: string,
    keywords: string[]
};

type WikipediaArticle = {
    title: string,
    content: string
};

type SearchCorrectness<T> = {
    keyword: string,
    match: T,
    false_positive: T,
    false_negative: T
};

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

async function execBenchmark<T> (
    index_fn: IndexFn<T>,
    post_fn: PostprocessFn<T>,
    search_fn: SearchFn<T>,
    index: T,
    keywords: string[],
    articles: WikipediaArticle[]) : Promise<Result[]> {

    console.log("creating index.");
    const result_create_index = benchmark((doc, docid) => {
        index_fn({docid: docid}, doc.title, index);
        index_fn({docid: docid}, doc.content, index);
    }, articles);
    console.log(`time: ${result_create_index.time}`);

    console.log("index post process.");
    const result_post_index = benchmark(() => post_fn(index), [null]);
    console.log(`time: ${result_post_index.time}`);

    console.log(`index size in byte: ${calculateJsonSize(index)} byte`);
    console.log(`gziped index size in byte: ${await calculateGzipedJsonSize(index)} byte`);

    console.log("begin benchmark.");
    const result_search = benchmark((key) =>
        ({keyword: key, refs: search_fn(key, index)}), keywords);
    console.log(`time: ${result_search.time} ms`);

    return result_search.results;
}

function checkResult(correct: Result[], test: Result[]): SearchCorrectness<Reference[]>[] {
    const equals = (a: Reference, b: Reference) => a.docid === b.docid;
    return zipWith(correct, test, (a, b) => {
        return {
            keyword: a.keyword,
            match: intersect(a.refs, b.refs, equals),
            false_positive: difference(b.refs, a.refs, equals),
            false_negative: difference(a.refs, b.refs, equals),
        };
    });
}

function countResults<R>(results: SearchCorrectness<R[]>[]) : SearchCorrectness<number> {
    const count: SearchCorrectness<number> = {
        keyword: "",
        match: 0,
        false_positive: 0,
        false_negative: 0
    };
    for(let i = 0; i < results.length; i++) {
        count.match          += results[i].match.length;
        count.false_positive += results[i].false_positive.length;
        count.false_negative += results[i].false_negative.length;
    }
    return count;
}

async function prepareAndExecBenchmark<T>(
    name: string,
    articles: WikipediaArticle[],
    keywords: string[],
    ref_results: Result[],
    index_fn: IndexFn<T>,
    post_fn: PostprocessFn<T>,
    search_fn: SearchFn<T>,
    index: T
) : Promise<Result[]> {
    console.log(`${name} SEARCH`);
    const results = await execBenchmark<T>(index_fn, post_fn, search_fn, index, keywords, articles);
    const cheked_results = checkResult(ref_results, results);
    console.log(cheked_results);
    console.log(cheked_results.map((r) => ({keyword:r.keyword, false_negative: r.false_negative})).filter((x) => x.false_negative.length !== 0));
    console.log(countResults(cheked_results));

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
    const ref_results = await execBenchmark(addToLinearIndex, noPostProcess, searchLinear, linear_index, keywords, wikipedia_articles);
    console.log(ref_results);

    // bigram
    const bigram_index : RecordIndex = {};
    await prepareAndExecBenchmark(
        "BIGRAM INVERTED-INDEX",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(2, x)),
        noPostProcess,
        generateSearchFn(searchRecord, (x) => generateNgram(2, x)),
        bigram_index
    );
    
    // trigram
    const trigram_index : RecordIndex = {};
    await prepareAndExecBenchmark(
        "TRIGRAM INVERTED-INDEX",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(3, x)),
        noPostProcess,
        generateSearchFn(searchRecord, (x) => generateNgram(3, x)),
        trigram_index
    );
    
    // quadgram
    const quadgram_index : RecordIndex = {};
    await prepareAndExecBenchmark(
        "QUADGRAM INVERTED-INDEX",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(4, x)),
        noPostProcess,
        generateSearchFn(searchRecord, (x) => generateNgram(4, x)),
        quadgram_index
    );
    
    // Trie trigram
    const trie_trigram_index : TrieIndex = {refs: [], children: {}};
    await prepareAndExecBenchmark(
        "TRIGRAM TRIE",
        wikipedia_articles,
        keywords,
        ref_results,
        generateIndexFn(addToTrieIndex, (x) => generateNgramTrie(3, x)),
        noPostProcess,
        generateSearchFn(searchTrie, (x) => generateNgram(3, x)),
        trie_trigram_index
    );

    // Hybrid: en inverted index, ja bigram inverted index
    const hybrid_bigram_index : HybridIndex<RecordIndex, RecordIndex> = { ja: {}, en: {} };
    await prepareAndExecBenchmark(
        "HYBRID en:INVERTED-INDEX ja:BIGRAM INVERTED-INDEX",
        wikipedia_articles,
        keywords,
        ref_results,
        generateHybridIndexFn(
            addToRecordIndex, (x) => generateNgram(2, x),
            addToRecordIndex, (x) => [x],
        ),
        noPostProcess,
        generateHybridSearchFn(
            searchRecord, (x) => generateNgram(2, x),
            searchRecord, (x) => [x]
        ),
        hybrid_bigram_index
    );

    // Hybrid: en inverted index, ja wakachigaki inverted index
    const hybrid_wakachigaki_index : HybridIndex<RecordIndex, RecordIndex> = { ja: {}, en: {} };
    const parser = loadDefaultJapaneseParser();
    const ja_preprocess = compose(
        splitByKatakana,
        (words: string[]) => words.flatMap((w: string) => parser.parse(w) || [])
    );
    await prepareAndExecBenchmark(
        "HYBRID en:INVERTED-INDEX ja:wakachigaki INVERTED-INDEX",
        wikipedia_articles,
        keywords,
        ref_results,
        generateHybridIndexFn(
            addToRecordIndex, (x) => ja_preprocess([x]),
            addToRecordIndex, (x) => [x],
        ),
        noPostProcess,
        generateHybridSearchFn(
            searchRecord, (x) => ja_preprocess([x]),
            searchRecord, (x) => [x]
        ),
        hybrid_wakachigaki_index
    );
}

async function runBloom(run_hashes: number, run_bits: [number, number], wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[]) {
    console.log("LINEAR SEARCH");
    const linear_index : LinearIndex = [];
    const keywords = getAllKeywords(wikipedia_keyword);
    const ref_results = await execBenchmark(addToLinearIndex, noPostProcess, generateSearchFn(searchLinear), linear_index, keywords, wikipedia_articles);
    
    async function bloomSim(bits: number, hashes: number, articles: WikipediaArticle[], keywords: string[], ) {
        const bloom_index : BloomIndex = {index: {}, bits: bits, hashes: hashes};
        await prepareAndExecBenchmark(`bloom filter bits = ${bits}, hashes = ${hashes}`,
            articles, keywords, ref_results,
            generateIndexFn(addToBloomIndex, (x) => generate1ToNgram(4, x)),
            noPostProcess,
            generateSearchFn(searchBloom, (x) => generateNgram(4, x)), bloom_index
        );
    }
    
    for(let hashes = 2; hashes <= run_hashes; hashes++) {
        for(let bits = run_bits[0]; bits < run_bits[1]; bits = bits * 2) {
            await bloomSim(bits, hashes, wikipedia_articles, keywords);
        }
    }    
}

const num_articles = 10;
console.log("JAPANESE benchmark.");
await runAll(wikipedia_articles_ja.slice(0, num_articles), wikipedia_keyword_ja);
console.log("ENGLISH benchmark.");
await runAll(wikipedia_articles_en.slice(0, num_articles), wikipedia_keyword_en);
console.log("JAPANESE bloom benchmark.");
// hashes: 2, bits: 1024 * 128 is suitable
await runBloom(3, [1024, 512 * 1024], wikipedia_articles_ja.slice(0, num_articles), wikipedia_keyword_ja);
