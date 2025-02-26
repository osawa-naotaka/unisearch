import { LinearIndex, HybridTrieBigramInvertedIndex } from "@src/main";
import { getAllKeywords } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword_long } from "@test/wikipedia_ja_keyword_long";
import { wikipedia_en_extracted_1000 } from "@test/wikipedia_en_extracted_1000";
import { wikipedia_en_keyword } from "@test/wikipedia_en_keyword";
import { benchmarkMethod, BenchmarkMethods, BenchmarkResultAll, checkResult } from "@ref/bench/benchmark_prod_common";

// benchmark body
const run_nums = [10];
// const run_nums = [10, 20, 40, 80, 100];
const run_keywords = 10;
const num_trials = 1;

const methods = [
    { name: "Linear", index: LinearIndex },
    { name: "Bigram", index: HybridTrieBigramInvertedIndex },
];

const keywords_ja = getAllKeywords(wikipedia_ja_keyword_long).slice(0, run_keywords);
const benchmark_results_all_ja: BenchmarkResultAll[] = []

for(const num of run_nums) {
    benchmark_results_all_ja.push(await benchmarkMethod(methods, keywords_ja, wikipedia_ja_extracted_1000.slice(0, num), num_trials));
}

const keywords_en = getAllKeywords(wikipedia_en_keyword).slice(0, run_keywords);
const benchmark_results_all_en: BenchmarkResultAll[] = []

for(const num of run_nums) {
    benchmark_results_all_en.push(await benchmarkMethod(methods, keywords_en, wikipedia_en_extracted_1000.slice(0, num), num_trials));
}

export function output_fuzzy_result_false(methods: BenchmarkMethods, results: BenchmarkResultAll[]): string {
    let markdown = "";
    const method = methods.map(({ name }) => name);
    for(const m of method) {
        for(const result of results) {
            const ref_exact = result.results.get("Linear")?.exact_search_results || [];
            const res = result.results.get(m)?.fuzzy_search_results || [];
            const matching = checkResult(ref_exact, res);
            console.log(`method ${m}`);
            console.log(matching);
        }
    }
    return markdown;
}

console.log("English Results");
console.log(benchmark_results_all_en);
output_fuzzy_result_false(methods, benchmark_results_all_en);
console.log("Japanese Results");
console.log(benchmark_results_all_ja);
output_fuzzy_result_false(methods, benchmark_results_all_ja);
