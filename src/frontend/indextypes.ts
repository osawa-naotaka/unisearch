import type { IndexClass } from "@src/frontend/indexing";
import { GPULinearIndex } from "@src/method/gpulinearindex";
import { HybridBigramInvertedIndex } from "@src/method/hybridbigraminvertedindex";
import { LinearIndex } from "@src/method/linearindex";
import { HybridTrieBigramInvertedIndex } from "@src/method/hybridtriebigraminvertedindex";

export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    HybridBigramInvertedIndex,
    GPULinearIndex,
    HybridTrieBigramInvertedIndex,
};
