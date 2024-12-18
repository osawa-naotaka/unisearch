import { generate1ToNgram, generateNgram } from "@ref/algo";
import type { WikipediaArticle, WikipediaKeyword } from "@ref/bench/benchmark_common";
import { execBenchmark, generateBenchmarkRunner, getAllKeywords } from "@ref/bench/benchmark_common";
import type { BloomIndex } from "@ref/bloom";
import { addToBloomIndex, searchExactBloom } from "@ref/bloom";
import type { SearcherSet, SingleIndex } from "@ref/common";
import { generateIndexFn, generateSearchFn, intersectAll, noPostProcess } from "@ref/common";
import type { LinearIndex } from "@ref/linear";
import { addToLinearIndex, searchLinear } from "@ref/linear";
import { calculateJsonSize } from "@ref/util";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";

async function runBloom(
    run_hashes: number,
    run_bits: [number, number],
    wikipedia_articles: WikipediaArticle[],
    wikipedia_keyword: WikipediaKeyword[],
) {
    console.log("initializing bloom benchmark.");
    const keywords = getAllKeywords(wikipedia_keyword);
    console.log(`select all ${keywords.length} keywords...`);
    console.log("selected keywords are:");
    console.log(keywords);

    // article size
    console.log(`articles size: ${calculateJsonSize(wikipedia_articles)}`);

    // linear search
    console.log("LINEAR SEARCH");
    const linear_set: SearcherSet<LinearIndex> = {
        index_fn: addToLinearIndex,
        post_fn: noPostProcess,
        search_fn: searchLinear,
        index: [],
    };
    const ref_results = await execBenchmark(linear_set, keywords, wikipedia_articles);
    console.log(ref_results);

    // prepare benchmark runner
    const runner = generateBenchmarkRunner(wikipedia_articles, keywords, ref_results);
    const bloom_set: SearcherSet<SingleIndex<BloomIndex>> = {
        index_fn: generateIndexFn(addToBloomIndex, (x) => generate1ToNgram(4, x)),
        post_fn: noPostProcess,
        search_fn: generateSearchFn(searchExactBloom, (x) => generateNgram(4, x), intersectAll),
        index: { index: { index: {}, bits: run_bits[0], hashes: 2 }, numtoken: [] },
    };

    for (let hashes = 2; hashes <= run_hashes; hashes++) {
        for (let bits = run_bits[0]; bits < run_bits[1]; bits = bits * 2) {
            bloom_set.index = { index: { index: {}, bits: bits, hashes: hashes }, numtoken: [] };
            await runner(`BLOOM FILTER ${bits} bits, ${hashes} hashs`, bloom_set);
        }
    }
}

const num_articles = 100;

console.log("JAPANESE bloom benchmark.");
// hashes: 2, bits: 1024 * 128 is suitable
await runBloom(3, [1024, 512 * 1024], wikipedia_ja_extracted.slice(0, num_articles), wikipedia_ja_keyword);
