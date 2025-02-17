import { z } from "zod";

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
export const SearchEnv_z = z.object({
    field_names: z.record(z.string(), z.string()).optional(),
    key_fields: z.array(z.string()).optional(),
    search_targets: z.array(z.string()).optional(),
    weight: z.number().optional(),
    distance: z.number().optional()
});

export type SearchEnv = z.infer<typeof SearchEnv_z>;

export const StaticIndex_z = z.object({
    version: z.string(),
    type: z.string(),
    env: SearchEnv_z,
    index_entry: z.unknown()
});

export type StaticIndex<T> = {
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
    addKey(id: number, key: Record<string, unknown>): void;
    fixIndex(): void;
    search(env: SearchEnv, keyword: string[]): Promise<SearchResult[]>;
}

export type StaticSeekIndex = StaticIndex<SearchIndex<unknown>>;
export type StaticSeekIndexObject = StaticIndex<unknown>;
