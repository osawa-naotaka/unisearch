import type { Reference, Token } from "@src/common";
import { appendIfNotExists } from "@src/util";

export type SortedArrayIndex = {
    unsorted: Record<Token, Reference[]>,
    sorted: Record<Token, Reference[]>
};

export function addToSortedArrayIndex(ref: Reference, text: Token, index: SortedArrayIndex) {
    index.unsorted[text] = appendIfNotExists(ref, index.unsorted[text]);
}

export function createSortedArrayIndex(index: SortedArrayIndex) {
    console.log(index);
    for(const [k, v] of Object.entries(index.unsorted)) {
        index.sorted[k] = v;
    }
}

export function searchSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    return index.sorted[query] || [];
}
