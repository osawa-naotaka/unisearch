// version
export const Version = "1.1";

// types

// basic types
export type Path = string;
export type FieldName = string;
export type FieldNameMap = Record<FieldName, Path>;

// error class
export class UniSearchError extends Error {}

// index
export type UniIndex<T> = {
    version: string;
    type: string;
    env: SearchEnv;
    index_entry: T;
};

// query
export type SearchEnv = {
    field_names?: FieldNameMap;
    key_field?: Path;
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
    key: string | null;
    score: number;
    refs: Reference[];
};

// interface
export interface SearchIndex<T> {
    index_entry: T;
    setToIndex(id: number, path: Path, str: string): void;
    addKey(id: number, key: string): void;
    fixIndex(): void;
    search(env: SearchEnv, keyword: string): Promise<SearchResult[]>;
}
