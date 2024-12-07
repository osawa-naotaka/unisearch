import type { LinearIndex } from "@src/linear";
import type { SortedArrayIndex } from "@src/sortedarray";
import type { SearcherSet, SingleIndex, HybridIndex, Reference } from "@src/common";
import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { addToLinearIndex, searchLinear } from "@src/linear";
import { addToSortedArrayIndex, createSortedArrayIndex, searchExactSortedArray, searchFuzzySortedArray } from "@src/sortedarray";
import { generateNgram, generateNgramTrie } from "@src/algo";
import { generateHybridIndexFn, generateHybridPostprocessFn, generateHybridSearchFn, tokenIsTerm, intersectAll, noPostProcess } from "@src/common";
import { zipWith, difference, intersect } from "@src/algo";

const keyword = "ロンドン";
const article_begin = 0;
const article_end = 11;

// linear search
console.log("LINEAR SEARCH");
const linear_search_set: SearcherSet<SingleIndex<LinearIndex>> = {
    index_fn: (ref: Reference, text: string, index: SingleIndex<LinearIndex>) => addToLinearIndex(ref, text, index.index),
    post_fn: noPostProcess,
    search_fn: (query: string, index: SingleIndex<LinearIndex>) => searchLinear(query, index.index),
    index: { index: [], numtoken: {} }
}
wikipedia_ja_extracted.slice(article_begin, article_end).map((x, idx) => linear_search_set.index_fn({id: idx, n: 1 }, x.text, linear_search_set.index));
const ref_result = linear_search_set.search_fn(keyword, linear_search_set.index);
console.log(ref_result);

// Hybrid
const search_set: SearcherSet<HybridIndex<SortedArrayIndex, SortedArrayIndex>> = {
    index_fn: generateHybridIndexFn(
        addToSortedArrayIndex, (x) => generateNgramTrie(2, x),
        addToSortedArrayIndex, tokenIsTerm,
    ),
    post_fn: generateHybridPostprocessFn(createSortedArrayIndex, createSortedArrayIndex),
    search_fn: generateHybridSearchFn(
        searchExactSortedArray, (x) => generateNgram(2, x), intersectAll,
        searchFuzzySortedArray, tokenIsTerm, intersectAll
    ),
    index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] }, numtoken: {} }
}

wikipedia_ja_extracted.slice(article_begin, article_end).map((x, idx) => search_set.index_fn({id: idx, n: 1}, x.text, search_set.index));
search_set.post_fn(search_set.index);
const result = search_set.search_fn(keyword, search_set.index);
console.log(result);
console.log(checkResult(ref_result, result));

function checkResult(correct: Reference[], test: Reference[])  {
    const equals = (a: Reference, b: Reference) => a.id === b.id;
    return zipWith([correct], [test], (a, b) => ({
            match: intersect(a, b, equals),
            false_positive: difference(b, a, equals),
            false_negative: difference(a, b, equals),
        }));
}

