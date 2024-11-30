import type { Reference, Token } from "@src/common";
import { appendIfNotExists, beginWith } from "@src/util";

export type SortedArrayIndex = {
    unsorted: Record<Token, Reference[]>;
    sorted: [Token, Reference[]][];
};

export function addToSortedArrayIndex(ref: Reference, text: Token, index: SortedArrayIndex) {
    index.unsorted[text] = appendIfNotExists(ref, index.unsorted[text]);
}

export function createSortedArrayIndex(index: SortedArrayIndex) {
    index.sorted = Object.entries(index.unsorted).sort(([a], [b]) => a.localeCompare(b));
    index.unsorted = {};
}

export function searchExactSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    return Array.from(new Set([...index.sorted.filter(([word]) => query === word).flatMap(([_, refs]) => refs)]));
}

export function searchForwardSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    return Array.from(
        new Set([...index.sorted.filter(([token]) => beginWith(query, token)).flatMap(([_, refs]) => refs)]),
    );
}
