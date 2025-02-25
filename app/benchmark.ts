import type { WikipediaArticle } from "@ref/bench/benchmark_common";
import { calculateGzipedJsonSize, calculateJsonSize } from "@ref/util";
import { createIndex, search, indexToObject, createIndexFromObject, StaticSeekError, LinearIndex, GPULinearIndex, HybridTrieBigramInvertedIndex, HybridTrieTrigramInvertedIndex } from "@src/main";
import type { IndexClass, SearchResult } from "@src/main";
import { getAllKeywords } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword_long } from "@test/wikipedia_ja_keyword_long";
import { wikipedia_en_extracted_1000 } from "@test/wikipedia_en_extracted_1000";
import { wikipedia_en_keyword } from "@test/wikipedia_en_keyword";
import { zipWith, intersect, difference } from "@ref/algo";

export type BenchmarkResult = {
    type: string;
    indexing_time: number;
    reindexing_time: number;
    exact_search_time: number;
    fuzzy_search_time: number;
    gziped_index_size: number;
    exact_search_results: SearchResult[][];
    fuzzy_search_results: SearchResult[][];
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
        exact_search_results: [],
        fuzzy_search_results: [],
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
        benchmark_results.exact_search_results = exact_search_results;

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
        benchmark_results.fuzzy_search_results = fuzzy_search_results;
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
    result.results.set("Bigram", await execBenchmark(HybridTrieBigramInvertedIndex, {}, articles, keywords, num_trials));
    result.results.set("Trigram", await execBenchmark(HybridTrieTrigramInvertedIndex, {}, articles, keywords, num_trials));
    return result;
}

function result_header(header: string, method: string[]): string {
    let markdown = "";
    markdown += "\n---\n\n";
    markdown += `#### **${header}**\n`;
    markdown += ["Text Size", ...method].map((m) => `| ${m} `).join("") + "|\n";
    markdown += ["Text Size", ...method].map((m) => "| " + "-".repeat(m.length) + " ").join("") + "|\n";
    return markdown;
}

export function result_markdown(result_en: BenchmarkResultAll[], result_ja: BenchmarkResultAll[]): string {
    const method = ["Linear", "GPU", "Bigram", "Trigram"];
    let markdown = "";

    markdown += result_header("Exact Search Time (ms) (English)", method);
    for(const en of result_en) {
        markdown += `| ${(en.index_size / 1000).toFixed(0)} |`;
        markdown += method.map((m) => ` ${en.results.get(m)?.exact_search_time.toFixed(2)} |`).join("");
        markdown += "\n";
    }

    markdown += result_header("Fuzzy Search Time (ms) (English)", method);
    for(const en of result_en) {
        markdown += `| ${(en.index_size / 1000).toFixed(0)} |`;
        markdown += method.map((m) => ` ${en.results.get(m)?.fuzzy_search_time.toFixed(2)} |`).join("");
        markdown += "\n";
    }

    markdown += result_header("Fuzzy Search Time (ms) (Japanese)", method);
    for(const ja of result_ja) {
        markdown += `| ${(ja.index_size / 1000).toFixed(0)} |`;
        markdown += method.map((m) => ` ${ja.results.get(m)?.fuzzy_search_time.toFixed(2)} |`).join("");
        markdown += "\n";
    }

    markdown += result_header("Indexing Time (ms) (English)", method);
    for(const en of result_en) {
        markdown += `| ${(en.index_size / 1000).toFixed(0)} |`;
        markdown += method.map((m) => ` ${en.results.get(m)?.indexing_time.toFixed(2)} |`).join("");
        markdown += "\n";
    }

    markdown += result_header("Index Size (Gzipped, kbyte) (English)", method);
    for(const en of result_en) {
        markdown += `| ${(en.index_size / 1000).toFixed(0)} |`;
        markdown += method.map((m) => ` ${((en.results.get(m)?.gziped_index_size || 0) / 1000).toFixed(0)} |`).join("");
        markdown += "\n";
    }

    markdown += result_header("Index Size (Gzipped, kbyte) (Japanese)", method);
    for(const ja of result_ja) {
        markdown += `| ${(ja.index_size / 1000).toFixed(0)} |`;
        markdown += method.map((m) => ` ${((ja.results.get(m)?.gziped_index_size || 0) / 1000).toFixed(0)} |`).join("");
        markdown += "\n";
    }

    return markdown;
}

type SearchCorrectness<T> = {
    keyword: string;
    match: T;
    false_positive: T;
    false_negative: T;
};

function checkResult(ref: SearchResult[][], target: SearchResult[][]): SearchCorrectness<SearchResult[]>[] {
    return zipWith(ref, target, (r, t) => {
        const equals = (a: SearchResult, b: SearchResult) => a.id === b.id;
        return {
            keyword: "",
            match: intersect(r, t, equals),
            false_positive: difference(t, r, equals),
            false_negative: difference(r, t, equals),
        };
    });
}

function countResults<R>(results: SearchCorrectness<R[]>[]): SearchCorrectness<number> {
    const count: SearchCorrectness<number> = {
        keyword: "",
        match: 0,
        false_positive: 0,
        false_negative: 0,
    };
    for (let i = 0; i < results.length; i++) {
        count.match += results[i].match.length;
        count.false_positive += results[i].false_positive.length;
        count.false_negative += results[i].false_negative.length;
    }
    return count;
}

export function check_result_false(results: BenchmarkResultAll[]): string {
    let markdown = "";
    const method = ["GPU", "Bigram", "Trigram"];
    for(const m of method) {
        for(const result of results) {
            const ref_exact = result.results.get("Linear")?.exact_search_results || [];
            const res = result.results.get(m)?.exact_search_results || [];
            const matching = checkResult(ref_exact, res);
            const count = countResults(matching);
            markdown += `| ${m} | Exact |${result.index_size} | ${count.match} | ${count.false_positive} | ${count.false_negative} |\n`;
        }
    }
    for(const m of method) {
        for(const result of results) {
            const ref_exact = result.results.get("Linear")?.fuzzy_search_results || [];
            const res = result.results.get(m)?.fuzzy_search_results || [];
            const matching = checkResult(ref_exact, res);
            const count = countResults(matching);
            markdown += `| ${m} | Fuzzy |${result.index_size} | ${count.match} | ${count.false_positive} | ${count.false_negative} |\n`;
        }
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

console.log(result_markdown(benchmark_results_all_en, benchmark_results_all_ja));
console.log(benchmark_results_all_en);
console.log(check_result_false(benchmark_results_all_en));
console.log(benchmark_results_all_ja);
console.log(check_result_false(benchmark_results_all_ja));
