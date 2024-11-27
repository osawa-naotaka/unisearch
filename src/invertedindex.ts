import type { DocId, Token } from "@src/common";
import { appendIfNotExists, foldl1Array, union } from "@src/util";

export type InvertedIndex = Record<Token, DocId[]>;

export function addToInvertedIndex(docid: DocId, text: Token, index: InvertedIndex) {
    index[text] = appendIfNotExists(docid, index[text]);
}

export function searchInvertedIndex(query: Token, index: InvertedIndex): DocId[] {
    return index[query] || [];
}

export function searchAllInvertedIndex(query: Token, index: InvertedIndex): DocId[] {
    return foldl1Array(
        Object.entries(index).map(([token, docs]) => (token.includes(query) ? docs : [])),
        union,
    );
}
