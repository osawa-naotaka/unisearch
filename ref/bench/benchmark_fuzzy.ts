import { LinearIndex, HybridTrieBigramInvertedIndex, GPULinearIndex, HybridTrieTrigramInvertedIndex } from "@src/main";
import { countResults, getAllKeywords } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword_long } from "@test/wikipedia_ja_keyword_long";
import { wikipedia_en_extracted_1000 } from "@test/wikipedia_en_extracted_1000";
import { wikipedia_en_keyword } from "@test/wikipedia_en_keyword";
import { benchmarkMethod, BenchmarkMethods, BenchmarkResultAll, checkResult } from "@ref/bench/benchmark_prod_common";

function fuzzy_keyword_of(inschar: string, keywords: string[]): string[] {
    const result: string[] = [];
    let count = 0;
    for(const k of keywords) {
        const pos = count % k.length;
        switch(count % 3) {
            case 0:
                const deletion = k.slice(0, pos) + k.slice(pos + 1);
                result.push(k.length > 3 ? deletion : k);
                break;
            case 1:
                const insertion = k.slice(0, pos) + inschar + k.slice(pos);
                result.push(insertion);
                break;
            case 2:
                const replacement = k.slice(0, pos) + inschar + k.slice(pos + 1);
                result.push(replacement);
                break;
        }
        count += 1;
    }
    return result;
}

function output_fuzzy_result_false(methods: BenchmarkMethods, keywords: string[], ref:BenchmarkResultAll, test: BenchmarkResultAll): string {
    let markdown = "";
    const method = methods.map(({ name }) => name);
    const ref_exact = ref.results.get("Linear")?.exact_search_results || [];
    for(const m of method) {
        const res = test.results.get(m)?.fuzzy_search_results || [];
        const matching = checkResult(keywords, ref_exact, res);
        const count = countResults(matching);
        console.log(`method ${m}`);
        console.log(matching);
        console.log(count);
    }
    return markdown;
}

// benchmark body
const run_nums = [100];
const run_keywords = 100;
const num_trials = 1;

const methods = [
    { name: "Linear", index: LinearIndex },
    { name: "GPU", index: GPULinearIndex },
    { name: "Bigram", index: HybridTrieBigramInvertedIndex },
    { name: "Trigram", index: HybridTrieTrigramInvertedIndex },
];
const reference_methods = [
    { name: "Linear", index: LinearIndex },
];

const keywords_ja = getAllKeywords(wikipedia_ja_keyword_long).slice(0, run_keywords);
const keywords_ja_fuzzy = fuzzy_keyword_of("い", keywords_ja);
const benchmark_results_all_ja: BenchmarkResultAll[] = [];
const benchmark_results_reference_ja: BenchmarkResultAll[] = [];


for(const num of run_nums) {
    benchmark_results_reference_ja.push(await benchmarkMethod(reference_methods, keywords_ja, wikipedia_ja_extracted_1000.slice(0, num), num_trials));
    benchmark_results_all_ja.push(await benchmarkMethod(methods, keywords_ja_fuzzy, wikipedia_ja_extracted_1000.slice(0, num), num_trials));
}

const keywords_en = getAllKeywords(wikipedia_en_keyword).slice(0, run_keywords);
const keywords_en_fuzzy = fuzzy_keyword_of("a", keywords_en);
const benchmark_results_all_en: BenchmarkResultAll[] = []
const benchmark_results_reference_en: BenchmarkResultAll[] = [];

for(const num of run_nums) {
    benchmark_results_reference_en.push(await benchmarkMethod(reference_methods, keywords_en, wikipedia_en_extracted_1000.slice(0, num), num_trials));
    benchmark_results_all_en.push(await benchmarkMethod(methods, keywords_en_fuzzy, wikipedia_en_extracted_1000.slice(0, num), num_trials));
}


console.log("English Results");
console.log(benchmark_results_all_en);
output_fuzzy_result_false(methods, keywords_en, benchmark_results_reference_en[0], benchmark_results_all_en[0]);
console.log("Japanese Results");
console.log(benchmark_results_all_ja);
output_fuzzy_result_false(methods, keywords_ja, benchmark_results_reference_ja[0], benchmark_results_all_ja[0]);
