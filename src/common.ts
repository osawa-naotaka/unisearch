import { foldl1Array, intersect } from "@src/algo";
import { textToTerm } from "@src/preprocess";
import { isNonSpaceSeparatedChar } from "@src/util";

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
export type AggregateFn = (refs: Reference[][]) => Reference[];
export type PostprocessFn<T> = (index: T) => void;
export type HybridIndexFn<T, U> = (ref: Reference, text: Token, index: HybridIndex<T, U>) => void;
export type HybridSearchFn<T, U> = (query: Token, index: HybridIndex<T, U>) => Reference[];
export type HybridPostprocessFn<T, U> = (index: HybridIndex<T, U>) => void;

export const tokenIsTerm = (x: Term) => [x];
export const noPostProcess = () => {};
export const intersectAll = (refs: Reference[][]) => foldl1Array(intersect, refs);

export function generateIndexFn<T>(idxfn: IndexFn<T>, tttfn: TermToTokenFn): IndexFn<T> {
    return (ref: Reference, text: string, index: T) =>
        textToTerm([text])
            .flatMap(tttfn)
            .map((token) => idxfn(ref, token, index));
}

export function generateSearchFn<T>(search: SearchFn<T>, tttfn: TermToTokenFn, aggfn: AggregateFn): SearchFn<T> {
    return (query: string, index: T) =>
        foldl1Array(
            intersect,
            textToTerm([query])
                .map(tttfn)
                .map((tokens) => aggfn(tokens.map((token) => search(token, index)))),
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
    aggfn_ja: AggregateFn,
    searchfn_en: SearchFn<U>,
    tttfn_en: TermToTokenFn,
    aggfn_en: AggregateFn,
): HybridSearchFn<T, U> {
    return (query: string, index: HybridIndex<T, U>) =>
        foldl1Array(
            intersect,
            textToTerm([query]).map((term) =>
                isNonSpaceSeparatedChar(term[0])
                    ? aggfn_ja(tttfn_ja(term).map((token) => searchfn_ja(token, index.ja)))
                    : aggfn_en(tttfn_en(term).map((token) => searchfn_en(token, index.en))),
            ),
        );
}
