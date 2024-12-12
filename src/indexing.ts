import { extractStringsAll, getValueByPath } from "./traverser";

export class UniSearchError extends Error {}

const UniSearchType = {
    Linear: 0,
} as const;
type UniSearchType = (typeof UniSearchType)[keyof typeof UniSearchType];

const version = "1.0";

export type Path = string;
export type FieldName = string;
type FieldNameMap = Record<FieldName, Path>;
type IndexEntry = Record<Path, string[]>;

export type LinearSearchIndex = {
    field_names: Record<FieldName, Path>;
    key_fields: Path[];
    search_targets: Path[];
    index_entry: IndexEntry;
};

export type UniIndex = {
    version: string;
    type: UniSearchType;
    index: LinearSearchIndex;
};

export function createIndex(
    contents: any[],
    key_fields: Path[] = [],
    search_targets: Path[] = [],
    field_names: FieldNameMap = {},
): UniIndex | UniSearchError {
    try {
        if (!Array.isArray(contents)) throw new UniSearchError("unisearch: contents must be array.");
        if (contents.length === 0) throw new UniSearchError("unisearch: contents must not be empty.");

        // indexing for search
        const index_entry: IndexEntry = {};
        if (search_targets.length !== 0) {
            for (let id = 0; id < contents.length; id++) {
                for (const path of search_targets) {
                    const obj = getValueByPath(path, contents[id]);
                    if (obj === undefined) throw new UniSearchError(`unisearch: cannot find path ${path}`);
                    if (typeof obj === "string") {
                        index_entry[path][id] = obj;
                    } else if (Array.isArray(obj)) {
                        index_entry[path][id] = obj.join(" ");
                    } else {
                        throw new UniSearchError(`unisearch: ${path} is not string or array of string.`);
                    }
                }

                // indexing for key entry
                if (key_fields) {
                    for (const path of key_fields) {
                        const obj = getValueByPath(path, contents[id]);
                        if (obj === undefined) throw new UniSearchError(`unisearch: cannot find path ${path}`);
                        index_entry[path][id] = obj;
                    }
                }
            }
        } else {
            // indexing all, including key entries
            for (let id = 0; id < contents.length; id++) {
                for (const [path, obj] of extractStringsAll("", contents[id])) {
                    if (index_entry[path] === undefined) {
                        index_entry[path] = [];
                    }
                    index_entry[path][id] = obj;
                }
            }
        }

        return {
            version: version,
            type: UniSearchType.Linear,
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
