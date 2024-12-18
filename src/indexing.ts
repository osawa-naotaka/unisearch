import type { FieldNameMap, Path, SearchIndex, UniIndex } from "@src/base";
import { UniSearchError, Version } from "@src/base";
import { IndexTypes } from "@src/indextypes";
import { extractStringsAll, getValueByPath } from "@src/traverser";

export function createIndex<T>(
    SearchClass: new () => SearchIndex<T>,
    contents: unknown[],
    key_field: Path | null = null,
    search_targets: Path[] = [],
    field_names: FieldNameMap = {},
): UniIndex<SearchIndex<T>> | UniSearchError {
    try {
        if (!Array.isArray(contents)) throw new UniSearchError("unisearch: contents must be array.");
        if (contents.length === 0) throw new UniSearchError("unisearch: contents must not be empty.");

        // indexing for search
        const search_index = new SearchClass();
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
                if (key_field) {
                    const obj = getValueByPath(key_field, content);
                    if (obj === undefined) throw new UniSearchError(`unisearch: cannot find path ${key_field}`);
                    if (typeof obj !== "string") throw new UniSearchError(`unisearch: ${key_field} is not string.`);
                    search_index.setToIndex(id, key_field, obj);
                }
            });
        } else {
            // indexing all, including key entry
            contents.forEach((content, id) => {
                for (const [path, obj] of extractStringsAll("", content)) {
                    search_index.setToIndex(id, path, obj);
                }
            });
        }

        return {
            version: Version,
            type: SearchClass.name,
            field_names: field_names,
            key_field: key_field,
            search_targets: search_targets,
            index_entry: search_index,
        };
    } catch (e) {
        if (e instanceof UniSearchError) {
            return e;
        }
        throw e;
    }
}

export function createIndexFromObject<T>(index: UniIndex<T>): UniIndex<SearchIndex<T>> {
    return {
        version: index.version,
        type: index.type,
        field_names: index.field_names,
        key_field: index.key_field,
        search_targets: index.search_targets,
        index_entry: new IndexTypes[index.type](index.index_entry),
    };
}

export function indexToObject<T>(index: UniIndex<SearchIndex<T>>): UniIndex<T> {
    return {
        version: index.version,
        type: index.type,
        field_names: index.field_names,
        key_field: index.key_field,
        search_targets: index.search_targets,
        index_entry: index.index_entry.index_entry,
    };
}
