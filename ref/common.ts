import { foldl1Array, intersect, union } from "@ref/algo";
import { textToTerm } from "@ref/preprocess";
import { isNonSpaceSeparatedChar } from "@ref/util";

export type DocId = number;
export type Term = string;
export type Token = string;
export type Reference = {
    id: DocId;
    n: number;
    position?: {
        index: number;
        wordaround?: string;
    }[];
};

export type SingleIndex<T> = {
    numtoken: Record<DocId, number>;
    index: T;
};

export type HybridIndex<T, U> = {
    numtoken: Record<DocId, number>;
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
export const intersectAll = (refs: Reference[][]) => foldl1Array(intersectReference, refs);
export const unionAll = (refs: Reference[][]) => foldl1Array(union, refs);

export function intersectReference(a: Reference[], b: Reference[]): Reference[] {
    const refs = [];
    for (const x of a) {
        const y = b.find((y) => y.id === x.id);
        if (y) {
            refs.push({ id: x.id, n: y.n + x.n });
        }
    }
    return refs;
}

export function generateIndexFn<T>(idxfn: IndexFn<T>, tttfn: TermToTokenFn) {
    return (ref: Reference, text: string, index: SingleIndex<T>) => {
        for (const term of textToTerm([text])) {
            const tokens = tttfn(term);
            index.numtoken[ref.id] = (index.numtoken[ref.id] || 0) + tokens.length;
            for (const token of tokens) {
                idxfn(ref, token, index.index);
            }
        }
    };
}

export function generatePostprocessFn<T>(postfn: PostprocessFn<T>) {
    return (index: SingleIndex<T>) => postfn(index.index);
}

export function generateSearchFn<T>(searchfn: SearchFn<T>, tttfn: TermToTokenFn, aggfn: AggregateFn) {
    return (query: string, index: SingleIndex<T>) =>
        foldl1Array(
            intersect,
            textToTerm([query]).map((term) => aggfn(tttfn(term).map((token) => searchfn(token, index.index)))),
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
                const tokens = tttfn_ja(term);
                index.numtoken[ref.id] = (index.numtoken[ref.id] || 0) + tokens.length;
                for (const token of tokens) {
                    idxfn_ja(ref, token, index.ja);
                }
            } else {
                const tokens = tttfn_en(term);
                index.numtoken[ref.id] = (index.numtoken[ref.id] || 0) + tokens.length;
                for (const token of tokens) {
                    idxfn_en(ref, token, index.en);
                }
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

export function updateRefs(refs: Reference[], ref: Reference): Reference[] {
    const old_ref = refs?.find((x) => x.id === ref.id);
    const new_ref = { id: ref.id, n: (old_ref?.n || 0) + ref.n };
    const new_refs = refs?.filter((x) => x.id !== ref.id) || [];
    new_refs.push(new_ref);
    return new_refs;
}
