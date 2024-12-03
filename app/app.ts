import type { LinearIndex } from "@src/linear";
import type { SortedArrayIndex } from "@src/sortedarray";
import type { SearcherSet, HybridIndex, Reference } from "@src/common";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { addToLinearIndex, searchLinear } from "@src/linear";
import { addToSortedArrayIndex, createSortedArrayIndex, searchExactSortedArray, searchFuzzySortedArray } from "@src/sortedarray";
import { generateNgram, generateNgramTrie } from "@src/algo";
import { generateHybridIndexFn, generateHybridPostprocessFn, generateHybridSearchFn, tokenIsTerm, intersectAll } from "@src/common";
import { zipWith, difference, intersect } from "@src/algo";

const keyword = "HTTP";
const article_begin = 0;
const article_end = 11;

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
        searchFuzzySortedArray, tokenIsTerm, intersectAll
    ),
    index: { ja: { unsorted: {}, sorted: [] }, en: { unsorted: {}, sorted: [] } }
}

wikipedia_articles_ja.slice(article_begin, article_end).map((x, idx) => search_set.index_fn({docid: idx}, x.content, search_set.index));
search_set.post_fn(search_set.index);
const result = search_set.search_fn(keyword, search_set.index);
console.log(result);
console.log(checkResult(ref_result, result));

function checkResult(correct: Reference[], test: Reference[])  {
    const equals = (a: Reference, b: Reference) => a.docid === b.docid;
    return zipWith([correct], [test], (a, b) => ({
            match: intersect(a, b, equals),
            false_positive: difference(b, a, equals),
            false_negative: difference(a, b, equals),
        }));
}

