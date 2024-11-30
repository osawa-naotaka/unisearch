import type { Reference, Scheme, Token } from "@src/common";
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

export function searchSortedArray(scheme: Scheme, query: Token, index: SortedArrayIndex): Reference[] {
    if (scheme === "FUZZY") throw new Error("searchSortedArray: FUZZY is not implemented yet.");
    return scheme === "EXACT"
        ? Array.from(new Set([...index.sorted.filter(([word]) => query === word).flatMap(([_, refs]) => refs)]))
        : Array.from(
              new Set([...index.sorted.filter(([word]) => beginWith(query, word)).flatMap(([_, refs]) => refs)]),
          );
}
