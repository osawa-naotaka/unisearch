import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { getAllKeywords } from "@ref/bench/benchmark_common";
import { GPULinearIndex } from "@ref/method/gpulinearindex";
import { createIndex } from "@ref/method/indexing";
import { search } from "@ref/method/search";

const keywords = getAllKeywords(wikipedia_ja_keyword).slice(0, 100);
const articles = wikipedia_ja_extracted_1000;

const index = createIndex(GPULinearIndex, articles);
if (index instanceof Error) throw index;

console.log("benchmarking...");
while (true) {
    const start = performance.now();
    for (const keyword of keywords) {
        await search(index, keyword);
    }
    const end = performance.now();
    console.log(`time: ${(end - start) / keywords.length} ms/query`);
}
