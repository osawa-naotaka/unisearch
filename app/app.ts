import type { LinearIndex } from "@src/linear";
import type { SortedArrayIndex } from "@src/sortedarray";
import type { SearcherSet, HybridIndex } from "@src/common";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { addToLinearIndex, searchLinear } from "@src/linear";
import { addToSortedArrayIndex, createSortedArrayIndex, searchExactSortedArray, searchForwardSortedArray } from "@src/sortedarray";
import { generateNgram, generateNgramTrie } from "@src/ngram";
import { generateHybridIndexFn, generateHybridPostprocessFn, generateHybridSearchFn, tokenIsTerm, intersectAll } from "@src/common";

const keyword = "ナイター";
const article_begin = 0;
const article_end = 100;

// linear search
console.log("LINEAR SEARCH");
const linear_index : LinearIndex = [];
wikipedia_articles_ja.slice(article_begin, article_end).map((x, idx) => addToLinearIndex({docid: idx}, x.content, linear_index));
const ref_result = searchLinear(keyword, linear_index);
console.log(ref_result);

const search_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
    index_fn: generateHybridIndexFn(
        addToSortedArrayIndex, (x) => generateNgramTrie(2, x),
        addToSortedArrayIndex, tokenIsTerm,
    ),
    post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
    search_fn: generateHybridSearchFn(
        searchExactSortedArray, (x) => generateNgram(2, x), intersectAll,
        searchForwardSortedArray, tokenIsTerm, intersectAll
    ),
    index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] } }
}

wikipedia_articles_ja.slice(article_begin, article_end).map((x, idx) => search_set.index_fn({docid: idx}, x.content, search_set.index));
search_set.post_fn(search_set.index);
const result = search_set.search_fn(keyword, search_set.index);
console.log(result);
