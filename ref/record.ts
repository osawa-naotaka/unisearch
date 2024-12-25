import type { Reference, Token } from "@ref/common";
import { updateRefs } from "@ref/common";

export type RecordIndex = Record<Token, Reference[]>;

export function addToRecordIndex(ref: Reference, text: Token, index: RecordIndex) {
    index[text] = updateRefs(index[text], ref);
}

export function searchExactRecord(query: Token, index: RecordIndex): Reference[] {
    return index[query] || [];
}

export function searchForwardRecord(query: Token, index: RecordIndex): Reference[] {
    return Object.entries(index).flatMap(([token, refs]) => (token.startsWith(query) ? refs : []));
}
