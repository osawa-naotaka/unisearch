import type { WikipediaArticle, WikipediaKeyword } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { getKeywords, benchmark } from "@ref/bench/benchmark_common";
import { createIndex, UniSearchError } from "@src/indexing";
import { linearExactSearch } from "@src/linearsearch";

async function runAll(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[], n: number) {
    console.log("initializing benchmark...");
    const keywords = getKeywords(n, wikipedia_keyword);
    console.log(`select all ${keywords.length} keywords...`);
    console.log("selected keywords are:");
    console.log(keywords);

    const index_result = benchmark((arg) => createIndex(arg), [wikipedia_articles]);
    console.log(`indexing time: ${index_result.time} ms`);
    console.log(index_result.results[0]);

    const index = index_result.results[0];
    if(index instanceof UniSearchError) {
        throw index_result.results[0];
    } else {
        const search_result = benchmark((arg) => linearExactSearch(arg, index.index), keywords);
        console.log(search_result);
    }
}

await runAll(wikipedia_ja_extracted, wikipedia_ja_keyword, 20);
