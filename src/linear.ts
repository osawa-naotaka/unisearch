import { bitapSearch, createBitapKey } from "@src/algo";
import type { Reference } from "@src/common";
import { normalizeText } from "@src/preprocess";

export type LinearIndex = string[];

export function addToLinearIndex(ref: Reference, text: string, index: LinearIndex) {
    index[ref.id] += normalizeText(text);
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
    return index.flatMap((item, id) =>
        [...indicesOf(query_normalized, item)].map((pos) => ({
            id: id,
            n: 1,
            position: {
                index: pos,
                wordaround: item.slice(pos - 10, pos + query_normalized.length + 10),
            },
        })),
    );
}

export function searchFuzzyLinear(query: string, index: LinearIndex): Reference[] {
    const query_normalized = normalizeText(query);
    return index.flatMap((item, id) =>
        [...fuzzyIndicesOf(query_normalized, item)].map((pos) => ({
            id: id,
            n: 1,
            position: {
                index: pos,
                wordaround: item.slice(pos - 10, pos + query_normalized.length + 10),
            },
        })),
    );
}
