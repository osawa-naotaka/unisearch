import type { DocId, LinearIndex } from "@src/types";
import { docToWords, normalizeText } from "@src/preprocess";
import { intersect } from "@src/util";

export function docToLinearIndex(docid: DocId, doc: string[], index: LinearIndex) : LinearIndex {
    index.push({docid: docid, content: doc.map(normalizeText)});
    return index;
}

export function searchLinear(query: string, index: LinearIndex) : DocId[] {
    let result : DocId[] | null = null;
    const words = docToWords([query]);
    for (const word of words) {
        const docs = index.map(doc => doc.content.map(c => c.includes(word)).reduce((prev, cur) => prev || cur, false) ? doc.docid : null).filter(v => v !== null);
        if(docs) {
            if(result) {
                result = intersect(result, docs);
            } else {
                result = docs;
            }
        } else {
            return [];
        }
    }
    return result || [];
}
