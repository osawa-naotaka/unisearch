import { docToWords } from "@src/preprocess";
import { foldl1Array, intersect, isNonSpaceSeparatedChar } from "@src/util";

export type DocId = number;
export type Token = string;

export type HybridIndex<T, U> = {
    ja: T;
    en: U;
};

export type IndexFn<T> = (docid: DocId, token: Token, index: T) => void;
export type SearchFn<T> = (query: Token, index: T) => DocId[];
export type PreprocessFn = (text: string) => Token[];
export type HybridIndexFn<T, U> = (docid: DocId, text: Token, index: HybridIndex<T, U>) => void;
export type HybridSearchFn<T, U> = (query: Token, index: HybridIndex<T, U>) => DocId[];

export function generateIndexFn<T>(idxfn: IndexFn<T>, pre: PreprocessFn = (x) => [x]): IndexFn<T> {
    return (docid: DocId, text: string, index: T) =>
        docToWords([text])
            .flatMap((w) => pre(w))
            .map((word) => idxfn(docid, word, index));
}

export function generateSearchFn<T>(search: SearchFn<T>, pre: PreprocessFn = (x) => [x]): SearchFn<T> {
    return (query: string, index: T) =>
        foldl1Array(
            docToWords([query])
                .flatMap((w) => pre(w))
                .map((w) => search(w, index)),
            intersect,
        );
}

export function generateHybridIndexFn<T, U>(
    idxjafn: IndexFn<T>,
    idxjapre: PreprocessFn,
    idxenfn: IndexFn<U>,
    idxenpre: PreprocessFn,
): HybridIndexFn<T, U> {
    return (docid: DocId, text: string, index: HybridIndex<T, U>) => {
        for (const word of docToWords([text])) {
            if (isNonSpaceSeparatedChar(word[0])) {
                idxjapre(word).map((w) => idxjafn(docid, w, index.ja));
            } else {
                idxenpre(word).map((w) => idxenfn(docid, w, index.en));
            }
        }
    };
}

export function generateHybridSearchFn<T, U>(
    searchjafn: SearchFn<T>,
    searchjapre: PreprocessFn,
    searchenfn: SearchFn<U>,
    searchenpre: PreprocessFn,
): HybridSearchFn<T, U> {
    return (query: string, index: HybridIndex<T, U>) =>
        foldl1Array(
            docToWords([query]).map((word) =>
                foldl1Array(
                    isNonSpaceSeparatedChar(word[0])
                        ? searchjapre(word).map((w) => searchjafn(w, index.ja))
                        : searchenpre(word).map((w) => searchenfn(w, index.en)),
                    intersect,
                ),
            ),
            intersect,
        );
}
