import type { WikipediaArticle, WikipediaKeyword } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { getKeywords, benchmark } from "@ref/bench/benchmark_common";
import { setLinearIndexEntry, linearExactSearch, linearFuzzySearch } from "@src/linearsearch";
import { createIndex, UniSearchError, UniSearchType } from "@src/common";

async function runAll(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[], n: number) {
    console.log("initializing benchmark...");
    const keywords = getKeywords(n, wikipedia_keyword);
    console.log(`select all ${keywords.length} keywords.`);
    console.log("selected keywords are:");
    console.log(keywords);

    const index_result = benchmark((arg) => createIndex(UniSearchType.Linear, [], setLinearIndexEntry, arg, ["title"]), [wikipedia_articles]);
    console.log(`indexing time: ${index_result.time} ms`);

    const index = index_result.results[0];
    if(index instanceof UniSearchError) {
        throw index;
    } else {
        console.log(index);

        const exact_result = benchmark(linearExactSearch(index.index), keywords);
        console.log(`exact search time: ${exact_result.time} ms`);
        console.log(exact_result.results);

        console.log("fuzzy search is too slow. exec search only first 100 keywords.");
        const fuzzy_result = benchmark(linearFuzzySearch(index.index)(1), keywords.slice(0, 100));
        console.log(`fuzzy search time: ${fuzzy_result.time} ms`);
        console.log(fuzzy_result.results);
    }
}

await runAll(wikipedia_ja_extracted, wikipedia_ja_keyword, 20);
