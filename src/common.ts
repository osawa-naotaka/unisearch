import type { DocId, HybridIndex, IndexFn, PreprocessFn, SearchFn, HybridIndexFn, HybridSearchFn } from "@src/types";
import { docToWords } from "@src/preprocess";
import { intersect, isNonSpaceSeparatedChar } from "@src/util";

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


export function generateHybridIndexFn<T, U>(
    idxjafn: IndexFn<T>, idxjapre: PreprocessFn,
    idxenfn: IndexFn<U>, idxenpre: PreprocessFn,
) : HybridIndexFn<T, U> {
    return (docid: DocId, doc: string, index: HybridIndex<T, U>) : HybridIndex<T, U> => {
        for(const word of docToWords([doc])) {
            if(isNonSpaceSeparatedChar(doc[0])) {
                for(const w of idxjapre(word)) {
                    index.ja = idxjafn(docid, w, index.ja);
                }
            } else {
                for(const w of idxenpre(word)) {
                    index.en = idxenfn(docid, w, index.en);
                }
            }
        }
       return index;
    };
}

export function generateHybridSearchFn<T, U>(
    searchjafn: SearchFn<T>, searchjapre: PreprocessFn,
    searchenfn: SearchFn<U>, searchenpre: PreprocessFn
) : HybridSearchFn<T, U> {
    return (query: string, index: HybridIndex<T, U>) => {
        let result : DocId[] | null = null;
        for(const word of docToWords([query])) {
            if(isNonSpaceSeparatedChar(word[0])) {
                for(const w of searchjapre(word)) {
                    const docs = searchjafn(w, index.ja);
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
            } else {
                for(const w of searchenpre(word)) {
                    const docs = searchenfn(w, index.en);
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
            }
        }
        return result || [];    
    }
}
