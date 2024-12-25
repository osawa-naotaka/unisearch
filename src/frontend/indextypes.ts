import type { IndexClass } from "@src/frontend/indexing";
import { Hybrid } from "@src/method/hybrid";
import { InvertedIndex } from "@src/method/invertedindex";
import { LinearIndex } from "@src/method/linearindex";
import { Ngram } from "@src/method/ngram";

export const HyblidBigramInvertedIndex = Hybrid("HyblidBigramInvertedIndex", Ngram(2, InvertedIndex), InvertedIndex);

export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    HyblidBigramInvertedIndex,
};
