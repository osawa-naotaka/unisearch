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
export type UniIndex<T> = {
    version: string;
    type: string;
    field_names: Record<FieldName, Path>;
    key_field: Path | null;
    search_targets: Path[];
    index_entry: T;
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
    key: string | null;
    score: number;
    refs: Reference[];
};

// interface
export interface SearchIndex<T> {
    index_entry: T;
    setToIndex(id: number, path: Path, str: string): void;
    search(search_targets: Path[], key_field: Path | null, distance: number, keyword: string): SearchResult[];
}
