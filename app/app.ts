import type { LinearIndex } from "@src/linear";
import type { SortedArrayIndex } from "@src/sortedarray";
import type { SearcherSet } from "@src/common";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { addToLinearIndex, searchLinear } from "@src/linear";
import { addToSortedArrayIndex, createSortedArrayIndex, searchExactSortedArray } from "@src/sortedarray";
import { generateNgram, generateNgramTrie } from "@src/ngram";
import { generateIndexFn, generateSearchFn, intersectAll } from "@src/common";

const keyword = "ナイター";
const article_begin = 0;
const article_end = 100;

// linear search
console.log("LINEAR SEARCH");
const linear_index : LinearIndex = [];
wikipedia_articles_ja.slice(article_begin, article_end).map((x, idx) => addToLinearIndex({docid: idx}, x.content, linear_index));
const ref_result = searchLinear(keyword, linear_index);
console.log(ref_result);

const search_set: SearcherSet<SortedArrayIndex> = {
    index_fn: generateIndexFn(addToSortedArrayIndex, (x) => generateNgramTrie(2, x)),
    post_fn: createSortedArrayIndex,
    search_fn: generateSearchFn(searchExactSortedArray, (x) => generateNgram(2, x), intersectAll),
    index: { sorted: [], unsorted: {} }
};

wikipedia_articles_ja.slice(article_begin, article_end).map((x, idx) => search_set.index_fn({docid: idx}, x.content, search_set.index));
search_set.post_fn(search_set.index);
const result = search_set.search_fn(keyword, search_set.index);
console.log(result);
