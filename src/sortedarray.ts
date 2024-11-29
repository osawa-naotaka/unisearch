import type { Reference, Token } from "@src/common";
import { appendIfNotExists } from "@src/util";

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

function beginWith(pre: string, text: string): boolean {
    return pre.length > text.length ? false : text.slice(0, pre.length) === pre;
}

export function searchExactSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    return Array.from(new Set([...index.sorted.filter(([word]) => query === word).flatMap(([_, refs]) => refs)]));
}

export function searchSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    return Array.from(
        new Set([...index.sorted.filter(([word]) => beginWith(query, word)).flatMap(([_, refs]) => refs)]),
    );
}
