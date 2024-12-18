import type { WikipediaArticle, WikipediaKeyword } from "@ref/bench/benchmark_common";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { wikipedia_ja_keyword } from "@test/wikipedia_ja_keyword";
import { getKeywords, benchmark } from "@ref/bench/benchmark_common";
import { LinearIndex } from "@src/linearsearch";
import { createIndex } from "@src/indexing";
import { UniSearchError } from "@src/base";

async function runAll(wikipedia_articles: WikipediaArticle[], wikipedia_keyword: WikipediaKeyword[], n: number) {
    console.log("initializing benchmark...");
    const keywords = getKeywords(n, wikipedia_keyword);
    console.log(`select all ${keywords.length} keywords.`);
    console.log("selected keywords are:");
    console.log(keywords);

    const index_result = benchmark((arg) => createIndex(LinearIndex, arg, "title"), [wikipedia_articles]);
    console.log(`indexing time: ${index_result.time} ms`);

    const index = index_result.results[0];
    if(index instanceof UniSearchError) {
        throw index;
    } else {
        const linear_index = index.index_entry;
        console.log(index);

        const exact_result = benchmark((x) => linear_index.search([], null, 0, x), keywords);
        console.log(`exact search time: ${exact_result.time} ms`);
        console.log(exact_result.results);

        console.log("fuzzy search is too slow. exec search only first 100 keywords.");
        const fuzzy_result = benchmark((x) => linear_index.search([], null, 1, x), keywords.slice(0, 100));
        console.log(`fuzzy search time: ${fuzzy_result.time} ms`);
        console.log(fuzzy_result.results);
    }
}

await runAll(wikipedia_ja_extracted, wikipedia_ja_keyword, 20);
