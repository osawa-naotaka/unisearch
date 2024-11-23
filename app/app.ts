import type { BigramIndex, InvertedIndex, NgramIndex, LinearIndex } from "@src/types";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { calculateJsonSize } from "@src/util";
import { docToBigramIndex, searchBigram } from "@src/bigram";
import { docToInvertedIndex, searchInvertedIndex } from "@src/invertedindex";
import { docToNgramIndex, searchNgram } from "@src/ngram";
import { docToLinearIndex, searchLinear } from "@src/linear";
import { invertedIndexaLikeToTrieIndex, searchTrie } from "@src/trie";

// article size
console.log("articles size: " + calculateJsonSize(wikipedia_articles_ja));

// linear search
const linear_index : LinearIndex = [];
wikipedia_articles_ja.map((x, idx) => docToLinearIndex(idx, [x.title, x.content], linear_index));
console.log("linear index size: " + calculateJsonSize(linear_index));
console.log(searchLinear("John Lam", linear_index));
console.log(searchLinear("歩く", linear_index));


// 8-bit bigram
const bigram8bit_index : BigramIndex = {};
wikipedia_articles_ja.map((x, idx) => docToBigramIndex(idx, [x.title, x.content], bigram8bit_index));

console.log("8-bit bigram index size: " + calculateJsonSize(bigram8bit_index));
console.log(searchBigram("John Lam", bigram8bit_index));
console.log(searchBigram("歩く", bigram8bit_index));


// InvertedIndex
const inverted_index : InvertedIndex = {};
wikipedia_articles_ja.map((x, idx) => docToInvertedIndex(idx, [x.title, x.content], inverted_index));

console.log("inverted index size: " + calculateJsonSize(inverted_index));
console.log(searchInvertedIndex("John Lam", inverted_index));
console.log(searchInvertedIndex("歩く", inverted_index));


// normal bigram
const bigram_index : NgramIndex = {};
wikipedia_articles_ja.map((x, idx) => docToNgramIndex(2, false, idx, [x.title, x.content], bigram_index));

console.log("normal bigram index size: " + calculateJsonSize(bigram_index));
console.log(searchNgram(2, "John Lam", bigram_index));
console.log(searchNgram(2, "歩く", bigram_index));

// normal trigram
const trigram_index : NgramIndex = {};
wikipedia_articles_ja.map((x, idx) => docToNgramIndex(3, false, idx, [x.title, x.content], trigram_index));

console.log("normal trigram index size: " + calculateJsonSize(trigram_index));
console.log(searchNgram(3, "John Lam", trigram_index));
console.log(searchNgram(3, "歩く", trigram_index));

// extended trigram
const ex_trigram_index : NgramIndex = {};
wikipedia_articles_ja.map((x, idx) => docToNgramIndex(3, true, idx, [x.title, x.content], ex_trigram_index));

console.log("extended trigram index size: " + calculateJsonSize(ex_trigram_index));
console.log(searchNgram(3, "John Lam", ex_trigram_index));
console.log(searchNgram(3, "歩く", ex_trigram_index));

// quadgram
const quadgram_index : NgramIndex = {};
wikipedia_articles_ja.map((x, idx) => docToNgramIndex(4, false, idx, [x.title, x.content], quadgram_index));

console.log("quadgram index size: " + calculateJsonSize(quadgram_index));
console.log(searchNgram(4, "John Lam", quadgram_index));
console.log(searchNgram(4, "歩く", quadgram_index));


// quadgram
const ex_quadgram_index : NgramIndex = {};
wikipedia_articles_ja.map((x, idx) => docToNgramIndex(4, true, idx, [x.title, x.content], ex_quadgram_index));

console.log("extended quadgram index size: " + calculateJsonSize(ex_quadgram_index));
console.log(searchNgram(4, "John Lam", ex_quadgram_index));
console.log(searchNgram(4, "歩く", ex_quadgram_index));


// Trie: normal trigram
const trie_normal_trigram_index = invertedIndexaLikeToTrieIndex(trigram_index);
console.log("trie normal trigram index size: " + calculateJsonSize(trie_normal_trigram_index));
console.log(searchTrie(3, "John Lam", trie_normal_trigram_index));
console.log(searchTrie(3, "歩く", trie_normal_trigram_index));
