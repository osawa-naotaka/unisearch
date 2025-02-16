import type { IndexClass } from "@src/frontend/indexing";
import { GPULinearIndex } from "@src/method/gpulinearindex";
import { HybridBigramInvertedIndex } from "@src/method/hybridbigraminvertedindex";
import { HybridTrieBigramInvertedIndex } from "@src/method/hybridtriebigraminvertedindex";
import { LinearIndex } from "@src/method/linearindex";

export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    HybridBigramInvertedIndex,
    GPULinearIndex,
    HybridTrieBigramInvertedIndex,
};
