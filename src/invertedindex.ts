import { DocId } from "@src/types";
import { normalizeText, tokenizeTexts } from "@src/preprocess";
import { addLikeSet, intersect } from "@src/util";
import type { InvertedIndex } from "@src/types";

export function docToWords(doc: string[]) : Set<string> {
    const normalized = doc.map(normalizeText);
    const tokenized  = tokenizeTexts(normalized);
    const uniq_token = new Set(tokenized);

    return uniq_token;
}

export function docToInvertedIndex(docid: DocId, doc: string[], index: InvertedIndex) : InvertedIndex {
    for (const word of docToWords(doc)) {
        index[word] = addLikeSet(docid, index[word])
    }

    return index;
}

export function searchInvertedIndex(query: string, index: InvertedIndex) : DocId[] {
    let result : DocId[] | null = null;
    for (const word of docToWords([query])) {
        const docs = index[word];
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
