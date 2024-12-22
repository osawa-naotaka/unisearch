import { LinearIndex } from "@src/method/linearindex";
import { InvertedIndex } from "@src/method/invertedindex";
import { Hybrid } from "@src/hybrid";
import { Ngram } from "@src/ngram";
import { IndexClass } from "@src/indexing";

export const HyblidBigramInvertedIndex = Hybrid("HyblidBigramInvertedIndex", Ngram(2, InvertedIndex), InvertedIndex);

// using any. fix it.
// biome-ignore lint: cannot typing, so using any.
export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    HyblidBigramInvertedIndex,
};
