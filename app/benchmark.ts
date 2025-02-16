import type { WikipediaArticle } from "@ref/bench/benchmark_common";
import { calculateGzipedJsonSize, calculateJsonSize } from "@ref/util";
import { createIndex, search, indexToObject, createIndexFromObject, StaticSeekError, LinearIndex, GPULinearIndex, HybridTrieBigramInvertedIndex } from "@src/main";
import type { IndexClass } from "@src/main";
import { getAllKeywords } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword_long } from "@test/wikipedia_ja_keyword_long";
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
export type BenchmarkResultAll = {
    index_size: number;
    results: Map<string, BenchmarkResult>;
};

export async function execBenchmark(
    index_class: IndexClass,
    option: Record<string, unknown>,
    articles: WikipediaArticle[],
    keywords: string[],
    num_trials: number
): Promise<BenchmarkResult> {
    const benchmark_results: BenchmarkResult = {
        type: index_class.name,
        indexing_time: 0,
        reindexing_time: 0,
        exact_search_time: 0,
        fuzzy_search_time: 0,
        gziped_index_size: 0,
    };

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
        const exact_search_results = [];
        for(const k of keywords) {
            const result = await search(reindex, `"${k}"`);
            if(result instanceof StaticSeekError) throw result;
            exact_search_results.push(result);
        }
        const exact_search_end = performance.now();

        const exact_search_time = (exact_search_end - exact_search_start) / exact_search_results.length;
        console.log(`exact search time: ${exact_search_time} ms/query`);
        benchmark_results.exact_search_time += exact_search_time;

        const fuzzy_search_start = performance.now();
        const fuzzy_search_results = [];
        for(const k of keywords) {
            const result = await search(reindex, k);
            if(result instanceof StaticSeekError) throw result;
            fuzzy_search_results.push(result);
        }
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

export async function benchmarkMethod(keywords: string[], articles: WikipediaArticle[], num_trials: number) {
    const result: BenchmarkResultAll = {
        index_size: calculateJsonSize(articles),
        results: new Map<string, BenchmarkResult>(),
    };
    result.results.set("Linear", await execBenchmark(LinearIndex, {}, articles, keywords, num_trials));
    result.results.set("GPU", await execBenchmark(GPULinearIndex, {}, articles, keywords, num_trials));
    result.results.set("Inverted", await execBenchmark(HybridTrieBigramInvertedIndex, {}, articles, keywords, num_trials));
    return result;
}

export function result_markdown(result_en: BenchmarkResultAll[], result_ja: BenchmarkResultAll[]): string {
    let markdown = "";
    markdown += "#### **Exact Search Time (ms) (English)**\n";
    markdown += "| Text Size | Linear | GPU | Inverted |\n";
    markdown += "|-----------|--------|-----|----------|\n";

    for(const en of result_en) {
        markdown += `| ${(en.index_size / 1000).toFixed(0)} | ${en.results.get("Linear")?.exact_search_time.toFixed(2)} | ${en.results.get("GPU")?.exact_search_time.toFixed(2)} | ${en.results.get("Inverted")?.exact_search_time.toFixed(2)} |\n`;
    }

    markdown += "\n---\n\n";
    markdown += "#### **Fuzzy Search Time (ms) (English)**\n";
    markdown += "| Text Size | Linear | GPU | Inverted |\n";
    markdown += "|-----------|--------|-----|----------|\n";

    for(const en of result_en) {
        markdown += `| ${(en.index_size / 1000).toFixed(0)} | ${en.results.get("Linear")?.fuzzy_search_time.toFixed(2)} | ${en.results.get("GPU")?.fuzzy_search_time.toFixed(2)} | ${en.results.get("Inverted")?.fuzzy_search_time.toFixed(2)} |\n`;
    }

    markdown += "\n---\n\n";
    markdown += "#### **Fuzzy Search Time (ms) (Japanese)**\n";
    markdown += "| Text Size | Linear | GPU | Inverted |\n";
    markdown += "|-----------|--------|-----|----------|\n";

    for(const ja of result_ja) {
        markdown += `| ${(ja.index_size / 1000).toFixed(0)} | ${ja.results.get("Linear")?.fuzzy_search_time.toFixed(2)} | ${ja.results.get("GPU")?.fuzzy_search_time.toFixed(2)} | ${ja.results.get("Inverted")?.fuzzy_search_time.toFixed(2)} |\n`;
    }

    markdown += "\n---\n\n";
    markdown += "#### **Indexing Time (ms) (English)**\n";
    markdown += "| Text Size | Linear | GPU | Inverted |\n";
    markdown += "|-----------|--------|-----|----------|\n";

    for(const en of result_en) {
        markdown += `| ${(en.index_size / 1000).toFixed(0)} | ${en.results.get("Linear")?.indexing_time.toFixed(2)} | ${en.results.get("GPU")?.indexing_time.toFixed(2)} | ${en.results.get("Inverted")?.indexing_time.toFixed(0)} |\n`;
    }

    markdown += "\n---\n\n";
    markdown += "#### **Index Size (Gzipped, kbyte) (English)**\n";
    markdown += "| Text Size | Linear | GPU | Inverted |\n";
    markdown += "|-----------|--------|-----|----------|\n";

    for(const en of result_en) {
        markdown += `| ${(en.index_size / 1000).toFixed(0)} | ${((en.results.get("Linear")?.gziped_index_size || 0) / 1000).toFixed(0)} | ${((en.results.get("GPU")?.gziped_index_size || 0) / 1000).toFixed(0)} | ${((en.results.get("Inverted")?.gziped_index_size || 0) / 1000).toFixed(0)} |\n`;
    }

    markdown += "\n---\n\n";
    markdown += "#### **Index Size (Gzipped, kbyte) (Japanese)**\n";
    markdown += "| Text Size | Linear | GPU | Inverted |\n";
    markdown += "|-----------|--------|-----|----------|\n";

    for(const ja of result_ja) {
        markdown += `| ${(ja.index_size / 1000).toFixed(0)} | ${((ja.results.get("Linear")?.gziped_index_size || 0) / 1000).toFixed(0)} | ${((ja.results.get("GPU")?.gziped_index_size || 0) / 1000).toFixed(0)} | ${((ja.results.get("Inverted")?.gziped_index_size || 0) / 1000).toFixed(0)} |\n`;
    }

    return markdown;
}


// benchmark body
// const run_nums = [100];
const run_nums = [10, 20, 40, 80, 100];
const run_keywords = 100;
const num_trials = 5;

const keywords_ja = getAllKeywords(wikipedia_ja_keyword_long).slice(0, run_keywords);
const benchmark_results_all_ja: BenchmarkResultAll[] = []

for(const num of run_nums) {
    benchmark_results_all_ja.push(await benchmarkMethod(keywords_ja, wikipedia_ja_extracted_1000.slice(0, num), num_trials));
}

const keywords_en = getAllKeywords(wikipedia_en_keyword).slice(0, run_keywords);
const benchmark_results_all_en: BenchmarkResultAll[] = []

for(const num of run_nums) {
    benchmark_results_all_en.push(await benchmarkMethod(keywords_en, wikipedia_en_extracted_1000.slice(0, num), num_trials));
}

console.log(result_markdown(await Promise.all(benchmark_results_all_en), await Promise.all(benchmark_results_all_ja)));
