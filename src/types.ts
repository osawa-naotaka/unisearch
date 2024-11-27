export type DocId = number;
export type Token = string;

export type IndexFn<T> = (docid: DocId, token: Token, index: T) => void;
export type SearchFn<T> = (query: string, index: T) => DocId[];
export type PreprocessFn = (text: string) => Token[];

export type HybridIndex<T, U> = {
    ja: T;
    en: U;
};

export type HybridIndexFn<T, U> = (docid: DocId, doc: string, index: HybridIndex<T, U>) => void;
export type HybridSearchFn<T, U> = (query: string, index: HybridIndex<T, U>) => DocId[];
