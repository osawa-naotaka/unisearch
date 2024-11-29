import { docToWords } from "@src/preprocess";
import { foldl1Array, intersect, isNonSpaceSeparatedChar } from "@src/util";

export type DocId = number;
export type Token = string;
export type Reference = {
    docid: DocId;
    position?: {
        index: number;
        wordaround?: string;
    };
};

export type HybridIndex<T, U> = {
    ja: T;
    en: U;
};

export type IndexFn<T> = (ref: Reference, token: Token, index: T) => void;
export type SearchFn<T> = (query: Token, index: T) => Reference[];
export type PreprocessFn = (token: Token) => Token[];
export type PostprocessFn<T> = (index: T) => void;
export type HybridIndexFn<T, U> = (ref: Reference, text: Token, index: HybridIndex<T, U>) => void;
export type HybridSearchFn<T, U> = (query: Token, index: HybridIndex<T, U>) => Reference[];
export type HybridPostprocessFn<T, U> = (index: HybridIndex<T, U>) => void;

export const noPreProcess = (x: Token) => [x];
export const noPostProcess = () => {};

export function generateIndexFn<T>(idxfn: IndexFn<T>, pre: PreprocessFn = (x) => [x]): IndexFn<T> {
    return (ref: Reference, text: string, index: T) =>
        docToWords([text])
            .flatMap((w) => pre(w))
            .map((word) => idxfn(ref, word, index));
}

export function generateSearchFn<T>(search: SearchFn<T>, pre: PreprocessFn = (x) => [x]): SearchFn<T> {
    return (query: string, index: T) =>
        foldl1Array(
            intersect,
            docToWords([query])
                .flatMap((w) => pre(w))
                .map((w) => search(w, index)),
        );
}

export function generateHybridIndexFn<T, U>(
    idxjafn: IndexFn<T>,
    idxjapre: PreprocessFn,
    idxenfn: IndexFn<U>,
    idxenpre: PreprocessFn,
): HybridIndexFn<T, U> {
    return (ref: Reference, text: string, index: HybridIndex<T, U>) => {
        for (const word of docToWords([text])) {
            if (isNonSpaceSeparatedChar(word[0])) {
                idxjapre(word).map((w) => idxjafn(ref, w, index.ja));
            } else {
                idxenpre(word).map((w) => idxenfn(ref, w, index.en));
            }
        }
    };
}

export function generateHybridPostprocessFn<T, U>(
    idxjapost: PostprocessFn<T>,
    idxenpost: PostprocessFn<U>,
): HybridPostprocessFn<T, U> {
    return (index: HybridIndex<T, U>) => {
        idxjapost(index.ja);
        idxenpost(index.en);
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
            intersect,
            docToWords([query]).map((word) =>
                foldl1Array(
                    intersect,
                    isNonSpaceSeparatedChar(word[0])
                        ? searchjapre(word).map((w) => searchjafn(w, index.ja))
                        : searchenpre(word).map((w) => searchenfn(w, index.en)),
                ),
            ),
        );
}
