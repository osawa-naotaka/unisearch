import { docToBigramIndex, searchBigram } from "@src/bigram";
import type { BigramIndex, InvertedIndex } from "@src/types";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { calculateJsonSize } from "@src/util";
import { docToInvertedIndex, searchInvertedIndex } from "@src/invertedindex";

const bigram_index : BigramIndex = {};
wikipedia_articles_ja.map((x, idx) => docToBigramIndex(idx, [x.title, x.content], bigram_index))

const inverted_index : InvertedIndex = {};
wikipedia_articles_ja.map((x, idx) => docToInvertedIndex(idx, [x.title, x.content], inverted_index));

console.log("articles size: " + calculateJsonSize(wikipedia_articles_ja));

console.log("bigram index size: " + calculateJsonSize(bigram_index));
console.log(searchBigram("simply static", bigram_index));
console.log(searchBigram("歩く", bigram_index));

console.log("inverted index size: " + calculateJsonSize(inverted_index));
console.log(searchInvertedIndex("John Lam", inverted_index));

