import * as v from "valibot";

// version
export const Version = "2.7.1";

// types

// basic types
export type Path = string;
export type FieldName = string;
export type FieldNameMap = Record<FieldName, Path>;

// error class
export class StaticSeekError extends Error {}

// index
export type IndexOpt = {
    key_fields?: Path[];
    search_targets?: Path[];
    distance?: number;
    weights?: [Path, number][];
};

export const SearchEnv_v = v.object({
    search_targets: v.optional(v.array(v.string())),
    field_names: v.record(v.string(), v.string()),
    weights: v.array(v.tuple([v.string(), v.number()])),
    distance: v.number(),
});

export type SearchEnv = v.InferOutput<typeof SearchEnv_v>;

export const StaticSeekIndexRoot_v = v.object({
    version: v.string(),
    type: v.string(),
    env: SearchEnv_v,
    index_entry: v.unknown(),
});

export type StaticSeekIndexRoot<T> = {
    version: string;
    type: string;
    env: SearchEnv;
    index_entry: T;
};

// query
export type Reference = {
    token: string;
    path: Path;
    pos?: number;
    wordaround?: string;
    keyword_range?: [number, number];
    distance: number;
};

export type SearchResult = {
    id: number;
    key: Record<string, unknown>;
    score: number;
    refs: Reference[];
};

// interface
export interface SearchIndex<T> {
    index_entry: T;
    setToIndex(id: number, path: Path, str: string[]): void;
    setDocumentLength(id: number, path: Path, length: number): void;
    addKey(id: number, key: Record<string, unknown>): void;
    fixIndex(): void;
    search(env: SearchEnv, keyword: string[]): Promise<SearchResult[]>;
}

export type StaticSeekIndex = StaticSeekIndexRoot<SearchIndex<unknown>>;
export type StaticSeekIndexObject = StaticSeekIndexRoot<unknown>;
export type SearchFnResult = Promise<SearchResult[] | StaticSeekError>;
export type SearchFn = (query: string) => SearchFnResult;
