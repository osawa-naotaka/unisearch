import type { Reference, Scheme, Token } from "@src/common";
import { appendIfNotExists, beginWith, foldl1Array, union } from "@src/util";

export type RecordIndex = Record<Token, Reference[]>;

export function addToRecordIndex(ref: Reference, text: Token, index: RecordIndex) {
    index[text] = appendIfNotExists(ref, index[text]);
}

export function searchRecord(scheme: Scheme, query: Token, index: RecordIndex): Reference[] {
    if (scheme === "FUZZY") {
        throw new Error("searchRecord: fuzzy is not implemented yet.");
    }
    if (scheme === "EXACT") {
        return index[query] || [];
    }

    return foldl1Array(
        union,
        Object.entries(index).map(([token, docs]) => (beginWith(query, token) ? docs : [])),
    );
}
