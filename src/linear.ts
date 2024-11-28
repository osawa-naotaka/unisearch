import type { Reference } from "@src/common";
import { normalizeText } from "@src/preprocess";

export type LinearIndex = string[];

export function addToLinearIndex(ref: Reference, text: string, index: LinearIndex) {
    index[ref.docid] += normalizeText(text);
}

export function searchLinear(query: string, index: LinearIndex): Reference[] {
    const query_normalized = normalizeText(query);
    return index.flatMap((c, docid) => {
        let pos = 0;
        let r: number;
        const result: Reference[] = [];
        while ((r = c.indexOf(query_normalized, pos)) !== -1) {
            result.push({
                docid: docid,
                position: {
                    index: r,
                    wordaround: c.slice(r - 10, r + query_normalized.length + 10),
                },
            });
            pos = r + query_normalized.length + 1;
        }
        return result;
    });
}
