import type { WikipediaArticle, WikipediaKeyword } from "@ref/bench/benchmark_common";
import { benchmark, getKeywords } from "@ref/bench/benchmark_common";
import { calculateGzipedJsonSize } from "@ref/util";
import { UniSearchError } from "@src/base";
import { createIndex, indexToObject } from "@src/indexing";
import { HyblidBigramInvertedIndex } from "@src/indextypes";
import { LinearIndex } from "@src/method/linearindex";
import { search } from "@src/search";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";

async function runAll(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[], n: number) {
    console.log("initializing benchmark...");
    const keywords = getKeywords(n, wikipedia_keyword);
    console.log(`select all ${keywords.length} keywords.`);
    console.log("selected keywords are:");
    console.log(keywords);

    const index_result = benchmark(
        (arg) => createIndex(LinearIndex, arg, { key_field: "title" }),
        [wikipedia_articles],
    );
    console.log(`indexing time: ${index_result.time} ms`);

    const index = index_result.results[0];
    if (index instanceof UniSearchError) {
        throw index;
    }

    console.log(index);
    console.log(`gziped index size: ${await calculateGzipedJsonSize(indexToObject(index))}`);

    const exact_result = benchmark(
        (x) => search(index, x),
        keywords.map((x) => `"${x}"`),
    );
    console.log(`exact search time per one keyword: ${exact_result.time / keywords.length} ms`);
    console.log(exact_result.results);

    console.log("fuzzy search is too slow. exec search only first 100 keywords.");
    const fuzzy_result = benchmark((x) => search(index, x), keywords.slice(0, 100));
    console.log(`fuzzy search time per one keyword: ${fuzzy_result.time / 100} ms`);
    console.log(fuzzy_result.results);

    const hybrid_index_result = benchmark(
        (arg) => createIndex(HyblidBigramInvertedIndex, arg, { key_field: "title" }),
        [wikipedia_articles],
    );
    console.log(`hybrid indexing time: ${hybrid_index_result.time} ms`);

    const hybrid_index = hybrid_index_result.results[0];
    if (hybrid_index instanceof UniSearchError) {
        throw hybrid_index;
    }
    console.log(hybrid_index);
    console.log(`gziped index size: ${await calculateGzipedJsonSize(indexToObject(hybrid_index))}`);

    const hybrid_result = benchmark(
        (x) => search(hybrid_index, x),
        keywords.map((x) => `"${x}"`),
    );
    console.log(`hybrid search time per keyword: ${hybrid_result.time / keywords.length} ms`);
    console.log(hybrid_result.results);
}

await runAll(wikipedia_ja_extracted, wikipedia_ja_keyword, 20);
