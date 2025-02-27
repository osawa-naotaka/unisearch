import { LinearIndex, GPULinearIndex, HybridTrieBigramInvertedIndex } from "@src/main";
import { getAllKeywords } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword_long } from "@test/wikipedia_ja_keyword_long";
import { wikipedia_en_extracted_1000 } from "@test/wikipedia_en_extracted_1000";
import { wikipedia_en_keyword } from "@test/wikipedia_en_keyword";
import { benchmarkMethod, BenchmarkResultAll, result_markdown } from "@ref/bench/benchmark_prod_common";

// benchmark body
const run_nums = [10, 20, 40, 80, 100];
const run_keywords = 100;
const num_trials = 5;

const methods = [
    { name: "Linear", index: LinearIndex },
    { name: "GPU", index: GPULinearIndex },
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

console.log(result_markdown(methods, benchmark_results_all_en, benchmark_results_all_ja));
