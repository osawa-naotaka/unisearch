import type { Reference, Token } from "@src/common";
import { appendIfNotExists, foldl1Array, union } from "@src/util";

export type RecordIndex = Record<Token, Reference[]>;

export function addToRecordIndex(ref: Reference, text: Token, index: RecordIndex) {
    index[text] = appendIfNotExists(ref, index[text]);
}

export function searchExactRecord(query: Token, index: RecordIndex): Reference[] {
    return index[query] || [];
}

export function searchForwardRecord(query: Token, index: RecordIndex): Reference[] {
    return foldl1Array(
        union,
        Object.entries(index).map(([token, docs]) => (token.startsWith(query) ? docs : [])),
    );
}
