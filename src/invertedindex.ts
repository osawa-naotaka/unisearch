import type { Token, Reference } from "@src/common";
import { appendIfNotExists, foldl1Array, union } from "@src/util";

export type InvertedIndex = Record<Token, Reference[]>;

export function addToInvertedIndex(ref: Reference, text: Token, index: InvertedIndex) {
    index[text] = appendIfNotExists(ref, index[text]);
}

export function searchInvertedIndex(query: Token, index: InvertedIndex): Reference[] {
    return index[query] || [];
}

export function searchAllInvertedIndex(query: Token, index: InvertedIndex): Reference[] {
    return foldl1Array(
        union,
        Object.entries(index).map(([token, docs]) => (token.includes(query) ? docs : [])),
    );
}
