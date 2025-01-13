import type { IndexClass } from "@src/frontend/indexing";
import { FlatLinearIndex } from "@src/method/flatlinearindex";
import { Hybrid } from "@src/method/hybrid";
import { InvertedIndex } from "@src/method/invertedindex";
import { LinearIndex } from "@src/method/linearindex";
import { LinearIndexString } from "@src/method/linearindexString";
import { Ngram } from "@src/method/ngram";

export const HybridBigramInvertedIndex = Hybrid("HybridBigramInvertedIndex", Ngram(2, InvertedIndex), InvertedIndex);

export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    HybridBigramInvertedIndex,
    FlatLinearIndex,
    LinearIndexString,
};
