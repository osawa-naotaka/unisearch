import type { Reference, HybridIndex, IndexFn, PostprocessFn, SearcherSet } from "@src/common";
import type { LinearIndex } from "@src/linear";
import type { RecordIndex } from "@src/record";
import type { TrieIndex } from "@src/trie";
import type { BloomIndex } from "@src/bloom";
import type { SortedArrayIndex } from "@src/sortedarray";
import { wikipedia_keyword_ja } from "@test/wikipedia_keyword.ja";
import { wikipedia_keyword_long_ja } from "@test/wikipedia_keyword_long.ja";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { wikipedia_keyword_en } from "@test/wikipedia_keyword.en";
import { wikipedia_articles_en } from "@test/wikipedia_articles.en";
import { calculateJsonSize, calculateGzipedJsonSize, compose, zipWith, intersect, difference } from "@src/util";
import { splitByKatakana } from "@src/preprocess";
import { generateIndexFn, generateSearchFn, generateHybridIndexFn, generateHybridSearchFn, noPostProcess, tokenIsTerm, generateHybridPostprocessFn } from "@src/common";
import { addToLinearIndex, searchLinear } from "@src/linear";
import { generate1ToNgram, generateNgram, generateNgramTrie } from "@src/ngram";
import { addToTrieIndex, searchTrie } from "@src/trie";
import { addToBloomIndex, searchBloom } from "@src/bloom";
import { addToRecordIndex, searchRecord } from "@src/record";
import { loadDefaultJapaneseParser } from "budoux";
import { addToSortedArrayIndex, createSortedArrayIndex, searchSortedArray } from "@src/sortedarray";

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

function execIndexing<T> (index_fn: IndexFn<T>, post_fn: PostprocessFn<T>, index: T, articles: WikipediaArticle[]) : BenchmarkResult<void>[] {
    const result_create_index = benchmark((doc, docid) => {
        index_fn({docid: docid}, doc.title, index);
        index_fn({docid: docid}, doc.content, index);
    }, articles);

    const result_post_index = benchmark((x) => post_fn(x), [index]);

    return [result_create_index, result_post_index];
}

async function execBenchmark<T> (
    searcher: SearcherSet<T>,
    keywords: string[],
    articles: WikipediaArticle[]) : Promise<Result[]> {

    console.log("start indexing.");
    const result_indexing = execIndexing(searcher.index_fn, searcher.post_fn, searcher.index, articles);
    console.log(`indexing time: ${result_indexing[0].time} ms`);
    console.log(`post process time: ${result_indexing[1].time} ms`);

    console.log(`index size in byte: ${calculateJsonSize(searcher.index)} byte`);
    console.log(`gziped index size in byte: ${await calculateGzipedJsonSize(searcher.index)} byte`);

    console.log("start search benchmark.");
    const result_search = benchmark((key) =>
        ({keyword: key, refs: searcher.search_fn(key, searcher.index)}), keywords);
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
    searcher: SearcherSet<T>
) : Promise<Result[]> {
    console.log(`${name} SEARCH`);
    const results = await execBenchmark<T>(searcher, keywords, articles);
    const cheked_results = checkResult(ref_results, results);
    console.log(cheked_results);
    console.log(cheked_results.map((r) => ({keyword:r.keyword, false_negative: r.false_negative})).filter((x) => x.false_negative.length !== 0));
    console.log(countResults(cheked_results));

    return results;
}

type Runner = <T>(name: string, searcher: SearcherSet<T>) => Promise<Result[]>;

function generateBenchmarkRunner(
    articles: WikipediaArticle[],
    keywords: string[],
    ref_results: Result[]
) : Runner {
    return <T>(name: string, searcher: SearcherSet<T>) => prepareAndExecBenchmark(name, articles, keywords, ref_results, searcher);
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
        index_fn: generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(2, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchRecord, (x) => generateNgram(2, x)),
        index: {}
    }
    await runner("BIGRAM RECORD", bigram_set);
    
    // trigram
    const trigram_set: SearcherSet<RecordIndex> = {
        index_fn: generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(3, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchRecord, (x) => generateNgram(3, x)),
        index: {}
    }
    await runner("TRIGRAM RECORD", trigram_set);
    
    // quadgram
    const quadgram_set: SearcherSet<RecordIndex> = {
        index_fn: generateIndexFn(addToRecordIndex, (x) => generate1ToNgram(4, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchRecord, (x) => generateNgram(4, x)),
        index: {}
    }
    await runner("QUADGRAM RECORD", quadgram_set);
    
    // Trie trigram
    const trie_trigram_set: SearcherSet<TrieIndex> = {
        index_fn: generateIndexFn(addToTrieIndex, (x) => generateNgramTrie(3, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchTrie, (x) => generateNgram(3, x)),
        index: {refs: [], children: {}}
    }
    await runner("TRIGRAM TRIE", trie_trigram_set);

    // Hybrid: en sorted arrya, ja bigram sorted array
    const hybrid_bigram_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
        index_fn: generateHybridIndexFn(
            addToSortedArrayIndex, (x) => generateNgramTrie(2, x),
            addToSortedArrayIndex, tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
        search_fn: generateHybridSearchFn(
            searchSortedArray, (x) => generateNgram(2, x),
            searchSortedArray, tokenIsTerm
        ),
        index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] } }
    }
    await runner("HYBRID en:SORTED-ARRAY ja:BIGRAM SORTED-ARRAY", hybrid_bigram_set);

    // Hybrid: en sorted array, ja wakachigaki sorted array
    const parser = loadDefaultJapaneseParser();
    const tokenize_ja = compose(
        splitByKatakana,
        (words: string[]) => words.flatMap((w: string) => parser.parse(w) || [])
    );
    const hybrid_wakachigaki_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
        index_fn: generateHybridIndexFn(
            addToSortedArrayIndex, (x) => tokenize_ja([x]),
            addToSortedArrayIndex, tokenIsTerm,
        ),
        post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
        search_fn: generateHybridSearchFn(
            searchSortedArray, (x) => tokenize_ja([x]),
            searchSortedArray, tokenIsTerm
        ),
        index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] } }
    }
    await runner("HYBRID en:SORTED-ARRAY ja:wakachigaki SORTED-ARRAY", hybrid_wakachigaki_set);
}

async function runBloom(run_hashes: number, run_bits: [number, number], wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[]) {
    console.log("initializing bloom benchmark.");
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
    const bloom_set: SearcherSet<BloomIndex> = {
        index_fn: generateIndexFn(addToBloomIndex, (x) => generate1ToNgram(4, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchBloom, (x) => generateNgram(4, x)),
        index: {index: {}, bits: run_bits[0], hashes: 2}
    };
    
    for(let hashes = 2; hashes <= run_hashes; hashes++) {
        for(let bits = run_bits[0]; bits < run_bits[1]; bits = bits * 2) {
            bloom_set.index = {index: {}, bits: bits, hashes: hashes};
            await runner(`BLOOM FILTER ${bits} bits, ${hashes} hashs`, bloom_set);
        }
    }    
}

const num_articles = 10;
console.log("JAPANESE benchmark.");
await runAll(wikipedia_articles_ja.slice(0, num_articles), wikipedia_keyword_ja);
console.log("JAPANESE benchmark with long keyword.");
await runAll(wikipedia_articles_ja.slice(0, num_articles), wikipedia_keyword_long_ja);
console.log("ENGLISH benchmark.");
await runAll(wikipedia_articles_en.slice(0, num_articles), wikipedia_keyword_en);
console.log("JAPANESE bloom benchmark.");
// hashes: 2, bits: 1024 * 128 is suitable
await runBloom(3, [1024, 512 * 1024], wikipedia_articles_ja.slice(0, num_articles), wikipedia_keyword_ja);
