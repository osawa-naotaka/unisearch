import type { IndexClass } from "@src/frontend/indexing";
import { GPULinearIndex } from "@src/method/gpulinearindex";
import { HybridTrieBigramInvertedIndex } from "@src/method/hybridtriebigraminvertedindex";
import { LinearIndex } from "@src/method/linearindex";

export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    GPULinearIndex,
    HybridTrieBigramInvertedIndex,
};
