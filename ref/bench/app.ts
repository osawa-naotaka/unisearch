import { difference, generateNgram, generateNgramTrie, intersect, zipWith } from "@ref/algo";
import type { HybridIndex, Reference, SearcherSet, SingleIndex } from "@ref/common";
import {
    generateHybridIndexFn,
    generateHybridPostprocessFn,
    generateHybridSearchFn,
    intersectAll,
    noPostProcess,
    tokenIsTerm,
} from "@ref/common";
import type { LinearIndex } from "@ref/linear";
import { addToLinearIndex, searchLinear } from "@ref/linear";
import type { SortedArrayIndex } from "@ref/sortedarray";
import {
    addToSortedArrayIndex,
    createSortedArrayIndex,
    searchForwardSortedArray,
    searchFuzzySortedArray,
} from "@ref/sortedarray";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";

const keyword = "ロンドン";
const article_begin = 0;
const article_end = 11;

// linear search
console.log("LINEAR SEARCH");
const linear_search_set: SearcherSet<SingleIndex<LinearIndex>> = {
    index_fn: (ref: Reference, text: string, index: SingleIndex<LinearIndex>) =>
        addToLinearIndex(ref, text, index.index),
    post_fn: noPostProcess,
    search_fn: (query: string, index: SingleIndex<LinearIndex>) => searchLinear(query, index.index),
    index: { index: [], numtoken: {} },
};
wikipedia_ja_extracted
    .slice(article_begin, article_end)
    .map((x, idx) => linear_search_set.index_fn({ id: idx, n: 1 }, x.text, linear_search_set.index));
const ref_result = linear_search_set.search_fn(keyword, linear_search_set.index);
console.log(ref_result);

// Hybrid
const search_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
    index_fn: generateHybridIndexFn(
        addToSortedArrayIndex,
        (x) => generateNgramTrie(2, x),
        addToSortedArrayIndex,
        tokenIsTerm,
    ),
    post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
    search_fn: generateHybridSearchFn(
        searchForwardSortedArray,
        (x) => generateNgram(2, x),
        intersectAll,
        searchFuzzySortedArray,
        tokenIsTerm,
        intersectAll,
    ),
    index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] }, numtoken: {} },
};

wikipedia_ja_extracted
    .slice(article_begin, article_end)
    .map((x, idx) => search_set.index_fn({ id: idx, n: 1 }, x.text, search_set.index));
search_set.post_fn(search_set.index);
const result = search_set.search_fn(keyword, search_set.index);
console.log(result);
console.log(checkResult(ref_result, result));

function checkResult(correct: Reference[], test: Reference[]) {
    const equals = (a: Reference, b: Reference) => a.id === b.id;
    return zipWith([correct], [test], (a, b) => ({
        match: intersect(a, b, equals),
        false_positive: difference(b, a, equals),
        false_negative: difference(a, b, equals),
    }));
}
