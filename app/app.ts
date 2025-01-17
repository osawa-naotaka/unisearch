import { benchmarkMethod } from "@app/benchmark";
import type { BechmarkResultAll } from "@app/benchmark";
import { getAllKeywords } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";

const run_nums = [100];
// const run_nums = [10, 20, 40, 80, 100];
const keywords = getAllKeywords(wikipedia_ja_keyword).slice(0, 100);
const benchmark_results_all: BechmarkResultAll[] = []

for(const num of run_nums) {
    benchmark_results_all.push(await benchmarkMethod(keywords, wikipedia_ja_extracted_1000.slice(0, num)));
}

console.log(benchmark_results_all);
