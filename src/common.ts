import type { DocId, IndexFn, PreprocessFn, SearchFn } from "@src/types";
import { docToWords } from "@src/preprocess";
import { intersect } from "@src/util";

export function generateIndexFn<T>(idxfn: IndexFn<T>, pre?: PreprocessFn) : IndexFn<T> {
    pre = pre || ((x) => [x]);
    return (docid: DocId, doc: string, index: T) : T => {
        for(const word of docToWords([doc]).flatMap(w => pre(w))) {
            index = idxfn(docid, word, index);
        }
        return index;
    };
}

export function generateSearchFn<T>(search: SearchFn<T>, pre?: PreprocessFn) : SearchFn<T> {
    pre = pre || ((x) => [x]);
    return (query: string, index: T) => {
        let result : DocId[] | null = null;
        for(const word of docToWords([query]).flatMap(w => pre(w))) {
            const docs = search(word, index);
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
}
