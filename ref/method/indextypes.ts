import type { IndexClass } from "@ref/method/indexing";
import { LinearIndex } from "@ref/method/linearindex";
import { LinearIndexString } from "@ref/method/linearindexstring";
import { FlatLinearIndex } from "@ref/method/flatlinearindex";
import { FlatLinearIndexString } from "@ref/method/flatlinearindexstring";
import { GPULinearIndex } from "@ref/method/gpulinearindex";


export const IndexTypes: { [key: string]: IndexClass } = {
    LinearIndex,
    LinearIndexString,
    FlatLinearIndex,
    FlatLinearIndexString,
    GPULinearIndex,
};
