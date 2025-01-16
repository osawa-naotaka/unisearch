import { type WikipediaArticle, getAllKeywords } from "@ref/bench/benchmark_common";
import { type IndexClass, createIndexFromObject, indexToObject } from "@ref/method/indexing";
import { FlatLinearIndex } from "@ref/method/flatlinearindex";
import { FlatLinearIndexString } from "@ref/method/flatlinearindexstring";
import { LinearIndex } from "@ref/method/linearindex";
import { LinearIndexString } from "@ref/method/linearindexstring";
import { GPULinearIndex } from "@ref/method/gpulinearindex";
import { HybridBigramInvertedIndex } from "@ref/method/indextypes";
import { UniSearchError } from "@src/main";
import { createIndex } from "@src/frontend/indexing";
import { search } from "@src/frontend/search";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { calculateGzipedJsonSize } from "@ref/util";
type BenchmarkResult = {
    indexing_time: number;
    reindexing_time: number;
    exact_search_time: number;
    fuzzy_search_time: number;
    index_size: number;
};

export async function execBenchmark(
    index_class: IndexClass,
    option: Record<string, unknown>,
    articles: WikipediaArticle[],
    keywords: string[],
): Promise<BenchmarkResult> {
    const benchmark_results: BenchmarkResult = {
        indexing_time: 0,
        reindexing_time: 0,
        exact_search_time: 0,
        fuzzy_search_time: 0,
        index_size: 0,
    };

    const num_trials = 5;
    for (let i = 0; i < num_trials; i++) {
        console.log(`${index_class.name} benchmark`);
        const index_start = performance.now();
        const index = createIndex(index_class, articles, option);
        const index_end = performance.now();
        if (index instanceof UniSearchError) throw index;
        const indexing_time = index_end - index_start;
        console.log(`indexing time: ${indexing_time} ms`);
        benchmark_results.indexing_time += indexing_time;

        const index_entry = indexToObject(index);
        const reindex_start = performance.now();
        const reindex = createIndexFromObject(index_entry);
        const reindex_end = performance.now();
        if (reindex instanceof UniSearchError) throw reindex;
        const reindexing_time = reindex_end - reindex_start;
        console.log(`reindexing time: ${reindexing_time} ms`);
        benchmark_results.reindexing_time += reindexing_time;

        const gzipped_index_size = await calculateGzipedJsonSize(index_entry);
        console.log(`gzipped index entry size: ${gzipped_index_size} bytes`);
        benchmark_results.index_size += gzipped_index_size;

        const exact_search_start = performance.now();
        const exact_search_results = [];
        for (const keyword of keywords) {
            exact_search_results.push(await search(reindex, `"${keyword}"`));
        }
        const exact_search_end = performance.now();

        const exact_search_time = (exact_search_end - exact_search_start) / keywords.length;
        console.log(`exact search time: ${exact_search_time} ms/query`);
        benchmark_results.exact_search_time += exact_search_time;

        const fuzzy_search_start = performance.now();
        const fuzzy_search_results = [];
        for (const keyword of keywords) {
            fuzzy_search_results.push(await search(reindex, keyword));
        }
        const fuzzy_search_end = performance.now();

        const fuzzy_search_time = (fuzzy_search_end - fuzzy_search_start) / keywords.length;
        console.log(`fuzzy search time: ${fuzzy_search_time} ms/query`);
        benchmark_results.fuzzy_search_time += fuzzy_search_time;
    }

    benchmark_results.indexing_time /= num_trials;
    benchmark_results.reindexing_time /= num_trials;
    benchmark_results.exact_search_time /= num_trials;
    benchmark_results.fuzzy_search_time /= num_trials;
    benchmark_results.index_size /= num_trials;

    return benchmark_results;
}

const keywords = getAllKeywords(wikipedia_ja_keyword).slice(0, 30);
const articles = wikipedia_ja_extracted_1000.slice(0, 1000);
const benchmark_results_linear = await execBenchmark(LinearIndex, {}, articles, keywords);
const benchmark_results_linear_string = await execBenchmark(LinearIndexString, {}, articles, keywords);
const benchmark_results_flat = await execBenchmark(FlatLinearIndex, {}, articles, keywords);
const benchmark_results_flat_string = await execBenchmark(FlatLinearIndexString, {}, articles, keywords);
const benchmark_results_gpu = await execBenchmark(GPULinearIndex, {}, articles, keywords);
const benchmark_results_hybrid = await execBenchmark(HybridBigramInvertedIndex, {}, articles, keywords);

console.log("benchmark results: LinearIndex");
console.log(benchmark_results_linear);
console.log("benchmark results: LinearIndexString");
console.log(benchmark_results_linear_string);
console.log("benchmark results: FlatLinearIndex");
console.log(benchmark_results_flat);
console.log("benchmark results: FlatLinearIndexString");
console.log(benchmark_results_flat_string);
console.log("benchmark results: GPULinearIndex");
console.log(benchmark_results_gpu);
console.log("benchmark results: HybridBigramInvertedIndex");
console.log(benchmark_results_hybrid);
