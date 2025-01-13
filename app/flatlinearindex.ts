import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { getAllKeywords, WikipediaArticle } from "@ref/bench/benchmark_common";
import { calculateJsonSize, calculateGzipedJsonSize } from "@ref/util";
import { createIndex, UniSearchError, search, LinearIndex } from "@src/main";
import { createIndexFromObject, IndexClass, indexToObject } from "@src/frontend/indexing";
import { FlatLinearIndex } from "@src/method/flatlinearindex";

export async function execBenchmark(
    index_class: IndexClass,
    option: Record<string, unknown>,
    articles: WikipediaArticle[],
    keywords: string[],
): Promise<void> {
    console.log("start indexing.");
    const index_start = performance.now();
    const index = createIndex(index_class, articles, option);
    const index_end = performance.now();
    if(index instanceof UniSearchError) throw index;
    console.log(`indexing time: ${index_end - index_start} ms`);

    const index_entry = indexToObject(index);
    console.log(`index size in byte: ${calculateJsonSize(index_entry)} byte`);
    console.log(`gziped index size in byte: ${await calculateGzipedJsonSize(index_entry)} byte`);
    const reindex_start = performance.now();
    const reindex = createIndexFromObject(index_entry);
    const reindex_end = performance.now();
    if(reindex instanceof UniSearchError) throw reindex;
    console.log(`reindexing time: ${reindex_end - reindex_start} ms`);

    console.log(reindex);

    console.log("start search benchmark.");
    const search_start = performance.now();
    const search_results = [];
    for(const keyword of keywords) {
        search_results.push(await search(reindex, keyword));
    }
    const search_end = performance.now();

    console.log(`search time: ${(search_end - search_start) / keywords.length} ms/query`);
    console.log(search_results);
}

const keywords = getAllKeywords(wikipedia_ja_keyword);
await execBenchmark(LinearIndex, {distance: 0}, wikipedia_ja_extracted_1000, keywords);
await execBenchmark(FlatLinearIndex, {distance: 0}, wikipedia_ja_extracted_1000, keywords);
await execBenchmark(LinearIndex, {distance:1}, wikipedia_ja_extracted_1000, keywords.slice(0, 100));
await execBenchmark(FlatLinearIndex, {distance:1}, wikipedia_ja_extracted_1000, keywords.slice(0, 100));
