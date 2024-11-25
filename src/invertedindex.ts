import { DocId } from "@src/types";
import { appendIfNotExists } from "@src/util";
import type { InvertedIndex } from "@src/types";

export function docToInvertedIndex(docid: DocId, doc: string, index: InvertedIndex) : InvertedIndex {
    index[doc] = appendIfNotExists(docid, index[doc]);
    return index;
}

export function searchInvertedIndex(query: string, index: InvertedIndex) : DocId[] {
    return index[query] || [];
}
