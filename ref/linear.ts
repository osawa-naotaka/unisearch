import { bitapSearch, createBitapKey } from "@ref/algo";
import type { Reference } from "@ref/common";
import { normalizeText } from "@ref/preprocess";

export type LinearIndex = string[];

export function addToLinearIndex(ref: Reference, doc: string, index: LinearIndex) {
    index[ref.id] += normalizeText(doc);
}

function* indicesOf(keyword: string, target: string): Generator<number> {
    let pos = target.indexOf(keyword, 0);
    while (pos !== -1) {
        yield pos;
        pos = target.indexOf(keyword, pos + keyword.length + 1);
    }
}

function* fuzzyIndicesOf(keyword: string, target: string): Generator<number> {
    const key = createBitapKey(keyword);
    let pos = bitapSearch(key, 1, target);
    while (pos !== null) {
        yield pos;
        pos = bitapSearch(key, 1, target, pos + keyword.length + 1);
    }
}

export function searchLinear(query: string, index: LinearIndex): Reference[] {
    const query_normalized = normalizeText(query);
    return index.flatMap((doc, id) => {
        const results = [...indicesOf(query_normalized, doc)];
        return results.length > 0
            ? {
                  id: id,
                  n: results.length,
                  position: results.map((x) => ({
                      index: x,
                      wordaround: doc.slice(x - 10, x + query_normalized.length + 10),
                  })),
              }
            : [];
    });
}

export function searchFuzzyLinear(query: string, index: LinearIndex): Reference[] {
    const query_normalized = normalizeText(query);
    return index.flatMap((doc, id) => {
        const results = [...fuzzyIndicesOf(query_normalized, doc)];
        return results.length > 0
            ? {
                  id: id,
                  n: results.length,
                  position: results.map((x) => ({
                      index: x,
                      wordaround: doc.slice(x - 10, x + query_normalized.length + 10),
                  })),
              }
            : [];
    });
}
