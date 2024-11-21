import { docToBigramIndex, docToBigrams } from "@src/bigram";
import type { BigramIndex } from "@src/types";
import { wikipedia_articles } from "@test/wikipedia_articles";

const index : BigramIndex = {};
wikipedia_articles.map((x, idx) => docToBigramIndex(idx, [x.title, x.content], index))

console.log(index);
console.log(docToBigrams(["simply static"]))


// const result1 = searchBigram("simply static", index);
// result1.map(x => console.log(wikipedia_articles[x]));
// console.log(searchBigram("simply static", index));
// console.log(searchBigram("歩く", index));

