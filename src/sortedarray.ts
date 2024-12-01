import { appendIfNotExists, binarySearch, refine } from "@src/algo";
import type { Reference, Token } from "@src/common";
import { compareWithUnicode } from "@src/util";

export type SortedArrayIndex = {
    unsorted: Record<Token, Reference[]>;
    sorted: [Token, Reference[]][];
};

export function addToSortedArrayIndex(ref: Reference, text: Token, index: SortedArrayIndex) {
    index.unsorted[text] = appendIfNotExists(ref, index.unsorted[text]);
}

export function createSortedArrayIndex(index: SortedArrayIndex) {
    index.sorted = Object.entries(index.unsorted).sort(([a], [b]) => compareWithUnicode(a, b));
    index.unsorted = {};
}

export function searchExactSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    const pos = binarySearch(index.sorted, [query, []], ([x], [y]) => compareWithUnicode(x, y));
    return pos ? index.sorted[pos][1] : [];
}

export function searchForwardSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    const items = refine(query, (x) => x[0], index.sorted);

    return Array.from(new Set([...items.flatMap(([_, refs]) => refs)]));
}
