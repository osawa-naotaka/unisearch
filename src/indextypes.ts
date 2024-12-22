import { Hybrid } from "@src/hybrid";
import type { IndexClass } from "@src/indexing";
import { InvertedIndex } from "@src/method/invertedindex";
import { LinearIndex } from "@src/method/linearindex";
import { Ngram } from "@src/ngram";

export const HyblidBigramInvertedIndex = Hybrid("HyblidBigramInvertedIndex", Ngram(2, InvertedIndex), InvertedIndex);

export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    HyblidBigramInvertedIndex,
};
