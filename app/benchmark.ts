import type { WikipediaArticle } from "@ref/bench/benchmark_common";
import { calculateGzipedJsonSize, calculateJsonSize } from "@ref/util";
import { createIndex, search, indexToObject, createIndexFromObject, StaticSeekError, LinearIndex, GPULinearIndex, HybridBigramInvertedIndex } from "@src/main";
import type { IndexClass } from "@src/main";
import { getAllKeywords } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { wikipedia_en_extracted_1000 } from "@test/wikipedia_en_extracted_1000";
import { wikipedia_en_keyword } from "@test/wikipedia_en_keyword";


export type BenchmarkResult = {
    type: string;
    indexing_time: number;
    reindexing_time: number;
    exact_search_time: number;
    fuzzy_search_time: number;
    gziped_index_size: number;
};
export type BechmarkResultAll = {
    index_size: number;
    results: BenchmarkResult[];
};

export async function execBenchmark(
    index_class: IndexClass,
    option: Record<string, unknown>,
    articles: WikipediaArticle[],
    keywords: string[],
): Promise<BenchmarkResult> {
    const benchmark_results: BenchmarkResult = {
        type: index_class.name,
        indexing_time: 0,
        reindexing_time: 0,
        exact_search_time: 0,
        fuzzy_search_time: 0,
        gziped_index_size: 0,
    };

    const num_trials = 1;
    for (let i = 0; i < num_trials; i++) {
        console.log(`${index_class.name} benchmark`);
        const index_start = performance.now();
        const index = createIndex(index_class, articles, option);
        const index_end = performance.now();
        if (index instanceof StaticSeekError) throw index;
        const indexing_time = index_end - index_start;
        console.log(`indexing time: ${indexing_time} ms`);
        benchmark_results.indexing_time += indexing_time;

        const index_entry = indexToObject(index);
        const reindex_start = performance.now();
        const reindex = createIndexFromObject(index_entry);
        const reindex_end = performance.now();
        if (reindex instanceof StaticSeekError) throw reindex;
        const reindexing_time = reindex_end - reindex_start;
        console.log(`reindexing time: ${reindexing_time} ms`);
        benchmark_results.reindexing_time += reindexing_time;

        const gzipped_index_size = await calculateGzipedJsonSize(index_entry);
        console.log(`gzipped index entry size: ${gzipped_index_size} bytes`);
        benchmark_results.gziped_index_size += gzipped_index_size;

        const exact_search_start = performance.now();
        const exact_search_results = await Promise.all(keywords.map(async (k) => await search(reindex, `"${k}"`)))
        const exact_search_end = performance.now();

        const exact_search_time = (exact_search_end - exact_search_start) / exact_search_results.length;
        console.log(`exact search time: ${exact_search_time} ms/query`);
        benchmark_results.exact_search_time += exact_search_time;

        const fuzzy_search_start = performance.now();
        const fuzzy_search_results = await Promise.all(keywords.map(async (k) => await search(reindex, k)))
        const fuzzy_search_end = performance.now();

        const fuzzy_search_time = (fuzzy_search_end - fuzzy_search_start) / fuzzy_search_results.length;
        console.log(`fuzzy search time: ${fuzzy_search_time} ms/query`);
        benchmark_results.fuzzy_search_time += fuzzy_search_time;
    }

    benchmark_results.indexing_time /= num_trials;
    benchmark_results.reindexing_time /= num_trials;
    benchmark_results.exact_search_time /= num_trials;
    benchmark_results.fuzzy_search_time /= num_trials;
    benchmark_results.gziped_index_size /= num_trials;

    return benchmark_results;
}

export async function benchmarkMethod(keywords: string[], articles: WikipediaArticle[]) {
    const result: BechmarkResultAll = {
        index_size: calculateJsonSize(articles),
        results: [],
    };
    result.results.push(await execBenchmark(LinearIndex, {}, articles, keywords));
    result.results.push(await execBenchmark(GPULinearIndex, {}, articles, keywords));
    result.results.push(await execBenchmark(HybridBigramInvertedIndex, {}, articles, keywords));
    return result;
}



// benchmark body
const run_nums = [100];
const run_keywords = 100;
// const run_nums = [10, 20, 40, 80, 100];
const keywords_ja = getAllKeywords(wikipedia_ja_keyword).slice(0, run_keywords);
const benchmark_results_all_ja: BechmarkResultAll[] = []

for(const num of run_nums) {
    benchmark_results_all_ja.push(await benchmarkMethod(keywords_ja, wikipedia_ja_extracted_1000.slice(0, num)));
}

const keywords_en = getAllKeywords(wikipedia_en_keyword).slice(0, run_keywords);
const benchmark_results_all_en: BechmarkResultAll[] = []

for(const num of run_nums) {
    benchmark_results_all_en.push(await benchmarkMethod(keywords_en, wikipedia_en_extracted_1000.slice(0, num)));
}

console.log("Japanese results.")
console.log(benchmark_results_all_ja);
console.log("English results.")
console.log(benchmark_results_all_en);
