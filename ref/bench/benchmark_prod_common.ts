import type { SearchCorrectness, WikipediaArticle } from "@ref/bench/benchmark_common";
import { calculateGzipedJsonSize, calculateJsonSize } from "@ref/util";
import { createIndex, search, indexToObject, createIndexFromObject, StaticSeekError } from "@src/main";
import type { IndexClass, SearchResult } from "@src/main";
import { countResults } from "@ref/bench/benchmark_common";
import { intersect, difference, zipWith3 } from "@ref/algo";

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
export type BenchmarkMethods = { name: string; index: IndexClass }[];

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

export async function benchmarkMethod(methods: BenchmarkMethods, keywords: string[], articles: WikipediaArticle[], num_trials: number) {
    const result: BenchmarkResultAll = {
        index_size: calculateJsonSize(articles),
        results: new Map<string, BenchmarkResult>(),
    };
    for(const method of methods) {
        result.results.set(method.name, await execBenchmark(method.index, {}, articles, keywords, num_trials));
    }
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

export function result_markdown(methods: BenchmarkMethods, result_en: BenchmarkResultAll[], result_ja: BenchmarkResultAll[]): string {
    let markdown = "";
    const method = methods.map(({ name }) => name);

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

function fuzzy_result_header(header: string): string {
    let markdown = "";
    markdown += "\n---\n\n";
    markdown += `#### **${header}**\n`;
    markdown += "| Method | Creation Time | Index size | Gziped size | Search Time | match | false positive | false negative |";
    markdown += "| ------ | ------------- | ---------- | ----------- | ----------- | ----- | -------------- | -------------- |";
    return markdown;
}

export function fuzzy_result_markdown(methods: BenchmarkMethods, keywords: string[], ref:BenchmarkResultAll, test: BenchmarkResultAll): string {
    let markdown = "";
    const method = methods.map(({ name }) => name);

    markdown += fuzzy_result_header("Fuzzy Search");

    const ref_exact = ref.results.get("Linear")?.exact_search_results || [];
    for(const m of method) {
        const target = test.results.get(m);
        if(target === undefined) throw new Error("fuzzy_result_markdown internal error.");
        const matching = checkResult(keywords, ref_exact, target.fuzzy_search_results);
        const count = countResults(matching);
        markdown += `| ${m} | ${target.indexing_time + target.reindexing_time} [ms] | ${test.index_size} [kbyte] | ${target.gziped_index_size} [kbyte] | ${target.fuzzy_search_time} [ms/query] | ${count.match} | ${count.false_positive} | ${count.false_negative} |\n`;
    }
    return markdown;
}

export function checkResult(keyword: string[], ref: SearchResult[][], target: SearchResult[][]): SearchCorrectness<SearchResult[]>[] {
    return zipWith3(keyword, ref, target, (k, r, t) => {
        const equals = (a: SearchResult, b: SearchResult) => a.id === b.id;
        return {
            keyword: k,
            match: intersect(r, t, equals),
            false_positive: difference(t, r, equals),
            false_negative: difference(r, t, equals),
        };
    });
}

export function check_result_false(methods: BenchmarkMethods, keyword: string[], results: BenchmarkResultAll[]): string {
    let markdown = "";
    const method = methods.map(({ name }) => name).filter((m) => m !== "Linear");
    for(const m of method) {
        for(const result of results) {
            const ref_exact = result.results.get("Linear")?.exact_search_results || [];
            const res = result.results.get(m)?.exact_search_results || [];
            const matching = checkResult(keyword, ref_exact, res);
            const count = countResults(matching);
            markdown += `| ${m} | Exact |${result.index_size} | ${count.match} | ${count.false_positive} | ${count.false_negative} |\n`;
        }
    }
    for(const m of method) {
        for(const result of results) {
            const ref_exact = result.results.get("Linear")?.fuzzy_search_results || [];
            const res = result.results.get(m)?.fuzzy_search_results || [];
            const matching = checkResult(keyword, ref_exact, res);
            const count = countResults(matching);
            markdown += `| ${m} | Fuzzy |${result.index_size} | ${count.match} | ${count.false_positive} | ${count.false_negative} |\n`;
        }
    }
    return markdown;
}
