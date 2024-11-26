import type { DocId, LinearIndex } from "@src/types";
import { normalizeText } from "@src/preprocess";

export function docToLinearIndex(docid: DocId, doc: string, index: LinearIndex) {
    if(index[docid]) {
        index[docid].content.push(normalizeText(doc));
    } else {
        index[docid] = {docid: docid, content: [normalizeText(doc)]};        
    }
}

export function searchLinear(query: string, index: LinearIndex) : DocId[] {
    return index.map(doc => doc.content.map(c => c.includes(query)).reduce((prev, cur) => prev || cur, false) ? doc.docid : null).filter(v => v !== null);
}
