
// version
export const Version = "1.0";

// types

// basic types
export type Path = string;
export type FieldName = string;
export type FieldNameMap = Record<FieldName, Path>;

// error class
export class UniSearchError extends Error {}

// index
export type UniSearchIndex<T> = {
    field_names: Record<FieldName, Path>;
    key_fields: Path[];
    search_targets: Path[];
    index_entry: T;
};

export type UniIndex<T> = {
    version: string;
    index: UniSearchIndex<T>;
};

// query
export type Reference = {
    token: string;
    path: Path;
    pos: number;
    wordaround: string;
    distance: number;
};

export type SearchResult = {
    id: number;
    keys: unknown;
    score: number;
    refs: Reference[];
};


// interface
export interface SearchIndex<T> {
    index_entry: T;
    setToIndex(id: number, path: Path, str: string): void;
    search(search_targets: Path[], key_fields: Path[], distance: number, keyword: string): SearchResult[];
}
