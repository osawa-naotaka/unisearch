// version
export const Version = "2.0.0";

// types

// basic types
export type Path = string;
export type FieldName = string;
export type FieldNameMap = Record<FieldName, Path>;

// error class
export class StaticSeekError extends Error {}

// index
export type StaticSeekIndexRoot<T> = {
    version: string;
    type: string;
    env: SearchEnv;
    index_entry: T;
};

// query
export type SearchEnv = {
    field_names?: FieldNameMap;
    key_fields?: Path[];
    search_targets?: Path[];
    weight?: number;
    distance?: number;
};

export type Reference = {
    token: string;
    path: Path;
    pos?: number;
    wordaround?: string;
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
    setToIndex(id: number, path: Path, str: string): void;
    addKey(id: number, key: Record<string, unknown>): void;
    fixIndex(): void;
    search(env: SearchEnv, keyword: string): Promise<SearchResult[]>;
}

export type StaticSeekIndex = StaticSeekIndexRoot<SearchIndex<unknown>>;
export type StaticSeekIndexObject = StaticSeekIndexRoot<unknown>;
