import type { IndexClass } from "@src/frontend/indexing";
import { LinearIndex } from "@src/method/linearindex";
import { GPULinearIndex } from "@src/method/gpulinearindex";
import { Hybrid } from "@src/method/hybrid";
import { InvertedIndex } from "@src/method/invertedindex";
import { Ngram } from "@src/method/ngram";

export const HybridBigramInvertedIndex = Hybrid("HybridBigramInvertedIndex", Ngram(2, InvertedIndex), InvertedIndex);

export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    HybridBigramInvertedIndex,
    GPULinearIndex,
};
