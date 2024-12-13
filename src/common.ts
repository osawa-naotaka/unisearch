export type Reference = {
    path: Path;
    pos: number;
    wordaround: string;
};

export type SearchResult = {
    query: string;
    index: number;
    keys: unknown;
    score: number;
    refs: Reference[];
};

export class UniSearchError extends Error {}

export const UniSearchType = {
    Linear: 0,
    InvertedBigram: 1,
} as const;
export type UniSearchType = (typeof UniSearchType)[keyof typeof UniSearchType];

export const Version = "1.0";

export type Path = string;
export type FieldName = string;
export type FieldNameMap = Record<FieldName, Path>;
export type LinearIndexEntry = Record<Path, string[]>;

export type UniSearchIndex<T> = {
    field_names: Record<FieldName, Path>;
    key_fields: Path[];
    search_targets: Path[];
    index_entry: T;
};

export type UniIndex<T> = {
    version: string;
    type: UniSearchType;
    index: UniSearchIndex<T>;
};
