import type { Reference, Scheme } from "@src/common";
import { normalizeText } from "@src/preprocess";

export type LinearIndex = string[];

export function addToLinearIndex(ref: Reference, text: string, index: LinearIndex) {
    index[ref.docid] += normalizeText(text);
}

function* indicesOf(keyword: string, target: string): Generator<number> {
    let pos = target.indexOf(keyword, 0);
    while (pos !== -1) {
        yield pos;
        pos = target.indexOf(keyword, pos + keyword.length + 1);
    }
}

export function searchLinear(scheme: Scheme, query: string, index: LinearIndex): Reference[] {
    if (scheme === "FUZZY") throw new Error("serachLinear: FUZZY is not implemented yet.");
    const query_normalized = normalizeText(query);
    return index.flatMap((item, docid) =>
        [...indicesOf(query_normalized, item)].map((pos) => ({
            docid: docid,
            position: {
                index: pos,
                wordaround: item.slice(pos - 10, pos + query_normalized.length + 10),
            },
        })),
    );
}
