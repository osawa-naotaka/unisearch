import { BinarySearchType } from "@ref/algo";
import { binarySearch, bitapSearch, createBitapKey, refine } from "@ref/algo";
import type { Reference, Token } from "@ref/common";
import { updateRefs } from "@ref/common";
import { compareString } from "@ref/util";

export type SortedArrayIndex = {
    unsorted: Record<Token, Reference[]>;
    sorted: [Token, Reference[]][];
};

export function prefixCompare(key: string, item: string) {
    return item.startsWith(key) ? 0 : key < item ? -1 : 1;
}

export function addToSortedArrayIndex(ref: Reference, text: Token, index: SortedArrayIndex) {
    index.unsorted[text] = updateRefs(index.unsorted[text], ref);
}

export function createSortedArrayIndex(index: SortedArrayIndex) {
    index.sorted = Object.entries(index.unsorted).sort(([a], [b]) => compareString(a, b));
    index.unsorted = {};
}

export function searchExactSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    const pos = binarySearch([query, []], ([x], [y]) => compareString(x, y), index.sorted, BinarySearchType.Exact);
    return pos ? index.sorted[pos][1] : [];
}

export function searchForwardSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    const items = refine([query, []], ([x], [y]) => prefixCompare(x, y), index.sorted);

    return [...items.flatMap(([_, refs]) => refs)];
}

export function searchFuzzySortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    const items = refine([query[0], []], ([x], [y]) => prefixCompare(x, y), index.sorted);
    const key = createBitapKey(query);
    const results = items
        .map((item, idx) => ({ idx: idx, result: bitapSearch(key, 1, item[0]) }))
        .filter((x) => x.result.length !== 0)
        .flatMap((x) => items[x.idx][1]);

    return results;
}
