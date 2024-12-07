import type { Reference, Token } from "@src/common";
import { foldl1Array, union } from "@src/algo";
import { updateRefs } from "@src/common";

export type RecordIndex = Record<Token, Reference[]>;

export function addToRecordIndex(ref: Reference, text: Token, index: RecordIndex) {
    index[text] = updateRefs(index[text], ref);
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
