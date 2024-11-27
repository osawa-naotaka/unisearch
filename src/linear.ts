import type { DocId } from "@src/common";
import { normalizeText } from "@src/preprocess";

export type LinearIndex = { docid: number; content: string[] }[];

export function addToLinearIndex(docid: DocId, text: string, index: LinearIndex) {
    if (index[docid]) {
        index[docid].content.push(normalizeText(text));
    } else {
        index[docid] = { docid: docid, content: [normalizeText(text)] };
    }
}

export function searchLinear(query: string, index: LinearIndex): DocId[] {
    return index
        .map((doc) =>
            doc.content.map((c) => c.includes(query)).reduce((prev, cur) => prev || cur, false) ? doc.docid : null,
        )
        .filter((v) => v !== null);
}
