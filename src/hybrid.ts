import { docToWords } from "@src/preprocess";
import { isNonSpaceSeparatedChar, intersect } from "@src/util";
import type { NgramFn, DocId, HybridIndex } from "@src/types";
import { docToNgramIndex, searchNgram } from "@src/ngram";
import { docToInvertedIndex, searchInvertedIndex } from "./invertedindex";

export function docToHybridIndex(fn: NgramFn, docid: DocId, doc: string[], index: HybridIndex) : HybridIndex {
    for (const word of docToWords(doc)) {
        if(isNonSpaceSeparatedChar(word[0])) {
            index.ngram = docToNgramIndex(fn, docid, [word], index.ngram);
        } else {
            index.inverted = docToInvertedIndex(docid, [word], index.inverted);
        }
    }
    return index;
}

export function searchHybrid(fn: NgramFn, query: string, index: HybridIndex) : DocId[] {
    let result : DocId[] | null = null;
    const words = docToWords([query]);
    for (const word of words) {
        const docs = isNonSpaceSeparatedChar(word[0]) ? searchNgram(fn, word, index.ngram) : searchInvertedIndex(word, index.inverted);
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
