import { getValueByPath, extractStringsAll } from "@src/traverser";
import { union } from "@src/algorithm";

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

export function createIndex<T>(
    type: UniSearchType,
    initial: T,
    set_fn: (index_entry: T, path: Path, id: number, str: string) => void,
    contents: unknown[],
    key_fields: Path[] = [],
    search_targets: Path[] = [],
    field_names: FieldNameMap = {},
): UniIndex<T> | UniSearchError {
    try {
        if (!Array.isArray(contents)) throw new UniSearchError("unisearch: contents must be array.");
        if (contents.length === 0) throw new UniSearchError("unisearch: contents must not be empty.");

        // indexing for search
        const index_entry: T = initial;
        if (search_targets.length !== 0) {
            contents.forEach((content, id) => {
                for (const path of search_targets) {
                    const obj = getValueByPath(path, content);
                    if (obj === undefined) throw new UniSearchError(`unisearch: cannot find path ${path}`);
                    if (typeof obj === "string") {
                        set_fn(index_entry, path, id, obj);
                    } else if (Array.isArray(obj)) {
                        set_fn(index_entry, path, id, obj.join(" "));
                    } else {
                        throw new UniSearchError(`unisearch: ${path} is not string or array of string.`);
                    }
                }

                // indexing for key entry
                if (key_fields) {
                    for (const path of key_fields) {
                        const obj = getValueByPath(path, content);
                        if (obj === undefined) throw new UniSearchError(`unisearch: cannot find path ${path}`);
                        if (typeof obj !== "string") throw new UniSearchError(`unisearch: ${path} is not string.`);
                        set_fn(index_entry, path, id, obj)
                    }
                }
            });
        } else {
            // indexing all, including key entries
            contents.forEach((content, id) => {
                for (const [path, obj] of extractStringsAll("", content)) {
                    set_fn(index_entry, path, id, obj);
                }
            });
        }

        return {
            version: Version,
            type: type,
            index: {
                field_names: field_names,
                key_fields: key_fields,
                search_targets: search_targets,
                index_entry: index_entry,
            },
        };
    } catch (e) {
        if (e instanceof UniSearchError) {
            return e;
        }
        throw e;
    }
}

export function searchSingle<T>(search_fn: (query: string, text: string) => number[], query: string, index: UniSearchIndex<T>): SearchResult[] {
    const result = new Map<number, SearchResult>();
    for (const path of index.search_targets.length === 0 ? Object.keys(index.index_entry) : index.search_targets) {
        index.index_entry[path].forEach((text, id) => {
            const pos = search_fn(query, text);
            if (pos.length !== 0) {
                const cur = result.get(id) || {
                    query: query,
                    index: id,
                    keys: index.key_fields.map((key) => index.index_entry[key][id]),
                    score: 0,
                    refs: [],
                };
                cur.refs = union(
                    cur.refs,
                    pos.map((p) => ({ path: path, pos: p, wordaround: text.slice(p - 10, p + query.length + 10) })),
                );
                result.set(id, cur);
            }
        });
    }
    return Array.from(result.values());
}
