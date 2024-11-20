import { docToBigramIndex, searchBigram } from "@src/main";
import type { BigramIndex } from "@src/main";
import { testdocs } from "@test/testdocs";

const index : BigramIndex = {};
docToBigramIndex(0, [testdocs[0].title, testdocs[0].description, testdocs[0].body], index);
docToBigramIndex(1, [testdocs[1].title, testdocs[1].description, testdocs[1].body], index);

console.log(searchBigram("simply static", index));
console.log(searchBigram("歩く", index));
