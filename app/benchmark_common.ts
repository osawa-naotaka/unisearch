import type { Reference } from "@src/common";
import type { IndexFn, PostprocessFn, SearcherSet } from "@src/common";
import { calculateJsonSize, calculateGzipedJsonSize } from "@src/util";
import { zipWith, intersect, difference } from "@src/algo";

type Result = {
    keyword: string,
    refs: Reference[]
};

type BenchmarkResult<R> = {
    time: number,
    results: R[]
};

export type WikipediaKeyword = {
    title: string,
    keywords: string[]
};

export type WikipediaArticle = {
    title: string,
    text: string
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

function execIndexing<T> (index_fn: IndexFn<T>, post_fn: PostprocessFn<T>, index: T, articles: WikipediaArticle[]) : BenchmarkResult<void>[] {
    const result_create_index = benchmark((doc, docid) => {
        index_fn({docid: docid}, doc.title, index);
        index_fn({docid: docid}, doc.text, index);
    }, articles);

    const result_post_index = benchmark((x) => post_fn(x), [index]);

    return [result_create_index, result_post_index];
}

export async function execBenchmark<T> (
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
    return zipWith(correct, test, (a, b) => ({
            keyword: a.keyword,
            match: intersect(a.refs, b.refs, equals),
            false_positive: difference(b.refs, a.refs, equals),
            false_negative: difference(a.refs, b.refs, equals),
    }));
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

export function generateBenchmarkRunner(
    articles: WikipediaArticle[],
    keywords: string[],
    ref_results: Result[]
) : Runner {
    return <T>(name: string, searcher: SearcherSet<T>) => prepareAndExecBenchmark(name, articles, keywords, ref_results, searcher);
}

export function getAllKeywords(keyword_array: WikipediaKeyword[]): string[] {
    return keyword_array.flatMap(k => k.keywords);
}
