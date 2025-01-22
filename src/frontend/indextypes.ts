import type { IndexClass } from "@src/frontend/indexing";
import { LinearIndex } from "@src/method/linearindex";
import { HybridBigramInvertedIndex } from "@src/method/hybridbigraminvertedindex";
import { GPULinearIndex } from "@src/method/gpulinearindex";

export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    HybridBigramInvertedIndex,
    GPULinearIndex,
};
