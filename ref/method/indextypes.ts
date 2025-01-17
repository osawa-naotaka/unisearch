import type { IndexClass } from "@ref/method/indexing";
import { Hybrid } from "@src/method/hybrid";
import { InvertedIndex } from "@src/method/invertedindex";
import { Ngram } from "@src/method/ngram";
import { LinearIndex } from "@ref/method/linearindex";
import { LinearIndexString } from "@ref/method/linearindexstring";
import { FlatLinearIndex } from "@ref/method/flatlinearindex";
import { FlatLinearIndexString } from "@ref/method/flatlinearindexstring";
import { GPULinearIndex } from "@ref/method/gpulinearindex";

export const HybridBigramInvertedIndex = Hybrid("HybridBigramInvertedIndex", Ngram(2, InvertedIndex), InvertedIndex);

export const IndexTypes: { [key: string]: IndexClass } = {
    HybridBigramInvertedIndex,
    LinearIndex,
    LinearIndexString,
    FlatLinearIndex,
    FlatLinearIndexString,
    GPULinearIndex,
};
