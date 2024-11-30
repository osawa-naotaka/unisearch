import { textToTerm } from "@src/preprocess";
import { foldl1Array, intersect, isNonSpaceSeparatedChar } from "@src/util";

export type DocId = number;
export type Term = string;
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

export type SearcherSet<T> = {
    index_fn: (ref: Reference, text: string, index: T) => void;
    post_fn: PostprocessFn<T>;
    search_fn: (query: string, index: T) => Reference[];
    index: T;
};

export type IndexFn<T> = (ref: Reference, token: Token, index: T) => void;
export type SearchFn<T> = (query: Token, index: T) => Reference[];
export type TermToTokenFn = (term: Term) => Token[];
export type PostprocessFn<T> = (index: T) => void;
export type HybridIndexFn<T, U> = (ref: Reference, text: Token, index: HybridIndex<T, U>) => void;
export type HybridSearchFn<T, U> = (query: Token, index: HybridIndex<T, U>) => Reference[];
export type HybridPostprocessFn<T, U> = (index: HybridIndex<T, U>) => void;

export const tokenIsTerm = (x: Term) => [x];
export const noPostProcess = () => {};

export function generateIndexFn<T>(idxfn: IndexFn<T>, tttfn: TermToTokenFn = tokenIsTerm): IndexFn<T> {
    return (ref: Reference, text: string, index: T) =>
        textToTerm([text])
            .flatMap(tttfn)
            .map((token) => idxfn(ref, token, index));
}

export function generateSearchFn<T>(search: SearchFn<T>, tttfn: TermToTokenFn = tokenIsTerm): SearchFn<T> {
    return (query: string, index: T) =>
        foldl1Array(
            intersect,
            textToTerm([query])
                .flatMap(tttfn)
                .map((token) => search(token, index)),
        );
}

export function generateHybridIndexFn<T, U>(
    idxfn_ja: IndexFn<T>,
    tttfn_ja: TermToTokenFn,
    idxfn_en: IndexFn<U>,
    tttfn_en: TermToTokenFn,
): HybridIndexFn<T, U> {
    return (ref: Reference, text: string, index: HybridIndex<T, U>) => {
        for (const term of textToTerm([text])) {
            if (isNonSpaceSeparatedChar(term[0])) {
                tttfn_ja(term).map((token) => idxfn_ja(ref, token, index.ja));
            } else {
                tttfn_en(term).map((token) => idxfn_en(ref, token, index.en));
            }
        }
    };
}

export function generateHybridPostprocessFn<T, U>(
    idxpostfn_ja: PostprocessFn<T>,
    idxpostfn_en: PostprocessFn<U>,
): HybridPostprocessFn<T, U> {
    return (index: HybridIndex<T, U>) => {
        idxpostfn_ja(index.ja);
        idxpostfn_en(index.en);
    };
}

export function generateHybridSearchFn<T, U>(
    searchfn_ja: SearchFn<T>,
    tttfn_ja: TermToTokenFn,
    searchfn_en: SearchFn<U>,
    tttfn_en: TermToTokenFn,
): HybridSearchFn<T, U> {
    return (query: string, index: HybridIndex<T, U>) =>
        foldl1Array(
            intersect,
            textToTerm([query]).map((term) =>
                foldl1Array(
                    intersect,
                    isNonSpaceSeparatedChar(term[0])
                        ? tttfn_ja(term).map((token) => searchfn_ja(token, index.ja))
                        : tttfn_en(term).map((token) => searchfn_en(token, index.en)),
                ),
            ),
        );
}
