import { extractStringsAll, getValueByPath } from "@src/traverser";
import { UniIndex, UniSearchError, Path, FieldNameMap, Version, SearchIndex } from "@src/base";

export function createIndex<T>(
    search_index: SearchIndex<T>,
    contents: unknown[],
    key_fields: Path[] = [],
    search_targets: Path[] = [],
    field_names: FieldNameMap = {},
): UniIndex<T> | UniSearchError {
    try {
        if (!Array.isArray(contents)) throw new UniSearchError("unisearch: contents must be array.");
        if (contents.length === 0) throw new UniSearchError("unisearch: contents must not be empty.");

        // indexing for search
        if (search_targets.length !== 0) {
            contents.forEach((content, id) => {
                for (const path of search_targets) {
                    const obj = getValueByPath(path, content);
                    if (obj === undefined) throw new UniSearchError(`unisearch: cannot find path ${path}`);
                    if (typeof obj === "string") {
                        search_index.setToIndex(id, path, obj);
                    } else if (Array.isArray(obj)) {
                        search_index.setToIndex(id, path, obj.join(" "));
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
                        search_index.setToIndex(id, path, obj);
                    }
                }
            });
        } else {
            // indexing all, including key entries
            contents.forEach((content, id) => {
                for (const [path, obj] of extractStringsAll("", content)) {
                    search_index.setToIndex(id, path, obj);
                }
            });
        }

        return {
            version: Version,
            index: {
                field_names: field_names,
                key_fields: key_fields,
                search_targets: search_targets,
                index_entry: search_index.index_entry,
            },
        };
    } catch (e) {
        if (e instanceof UniSearchError) {
            return e;
        }
        throw e;
    }
}
