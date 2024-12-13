import type { WikipediaArticle, WikipediaKeyword } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { getKeywords, benchmark } from "@ref/bench/benchmark_common";
import { setLinearIndexEntry, linearExactSearch } from "@src/linearsearch";
import { createIndex, UniSearchError, UniSearchType } from "@src/common";

async function runAll(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[], n: number) {
    console.log("initializing benchmark...");
    const keywords = getKeywords(n, wikipedia_keyword);
    console.log(`select all ${keywords.length} keywords.`);
    console.log("selected keywords are:");
    console.log(keywords);

    const index_result = benchmark((arg) => createIndex(UniSearchType.Linear, {}, setLinearIndexEntry, arg, ["title"]), [wikipedia_articles]);
    console.log(`indexing time: ${index_result.time} ms`);

    const index = index_result.results[0];
    if(index instanceof UniSearchError) {
        throw index;
    } else {
        console.log(index);

        const search_result = benchmark((arg) => linearExactSearch(arg, index.index), keywords);
        console.log(`search time: ${search_result.time} ms`);
        console.log(search_result.results);
    }
}

await runAll(wikipedia_ja_extracted, wikipedia_ja_keyword, 20);
