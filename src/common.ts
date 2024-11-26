import type { DocId, HybridIndex, IndexFn, PreprocessFn, SearchFn, HybridIndexFn, HybridSearchFn } from "@src/types";
import { docToWords } from "@src/preprocess";
import { accumulateArray, intersect, isNonSpaceSeparatedChar } from "@src/util";

export function generateIndexFn<T>(idxfn: IndexFn<T>, pre: PreprocessFn = x => [x]) : IndexFn<T> {
    return (docid: DocId, doc: string, index: T) =>
        docToWords([doc]).flatMap(w => pre(w)).map(word => idxfn(docid, word, index));;
}

export function generateSearchFn<T>(search: SearchFn<T>, pre: PreprocessFn = x => [x]) : SearchFn<T> {
    return (query: string, index: T) =>
        accumulateArray(docToWords([query]).flatMap(w => pre(w)).map(w => search(w, index)), intersect);
}


export function generateHybridIndexFn<T, U>(
    idxjafn: IndexFn<T>, idxjapre: PreprocessFn,
    idxenfn: IndexFn<U>, idxenpre: PreprocessFn,
) : HybridIndexFn<T, U> {
    return (docid: DocId, doc: string, index: HybridIndex<T, U>) => {
        for(const word of docToWords([doc])) {
            if(isNonSpaceSeparatedChar(word[0])) {
                idxjapre(word).map(w => idxjafn(docid, w, index.ja));
            } else {
                idxenpre(word).map(w => idxenfn(docid, w, index.en));
            }
        }
    };
}

export function generateHybridSearchFn<T, U>(
    searchjafn: SearchFn<T>, searchjapre: PreprocessFn,
    searchenfn: SearchFn<U>, searchenpre: PreprocessFn
) : HybridSearchFn<T, U> {
    return (query: string, index: HybridIndex<T, U>) =>
        accumulateArray(docToWords([query]).map(word =>
            isNonSpaceSeparatedChar(word[0]) ?
                searchjapre(word).flatMap(w => searchjafn(w, index.ja)) :
                searchenpre(word).flatMap(w => searchenfn(w, index.en))
        ), intersect);
}
