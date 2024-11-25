import { isNonSpaceSeparatedChar } from "@src/util";
import type { DocId, HybridIndex } from "@src/types";
import { docToNgramIndex, searchNgram } from "@src/ngram";
import { docToInvertedIndex, searchInvertedIndex } from "./invertedindex";

export function docToHybridIndex(docid: DocId, doc: string, index: HybridIndex) : HybridIndex {
    if(isNonSpaceSeparatedChar(doc[0])) {
        index.ngram = docToNgramIndex(docid, doc, index.ngram);
    } else {
        index.inverted = docToInvertedIndex(docid, doc, index.inverted);
    }
    return index;
}

export function searchHybrid(query: string, index: HybridIndex) : DocId[] {
    return isNonSpaceSeparatedChar(query[0]) ? searchNgram(query, index.ngram) : searchInvertedIndex(query, index.inverted);
}
