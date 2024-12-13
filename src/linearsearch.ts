import { bitapSearch, createBitapKey, union } from "@src/algorithm";
import type { FieldNameMap, LinearIndexEntry, Path, SearchResult, UniIndex, UniSearchIndex } from "@src/common";
import { UniSearchError, UniSearchType, Version } from "@src/common";
import { extractStringsAll, getValueByPath } from "@src/traverser";

function setEntry(index_entry: LinearIndexEntry, path: Path, id: number, str: string) {
    if (index_entry[path] === undefined) {
        index_entry[path] = [];
    }
    index_entry[path][id] = str;    
}

export function createIndex(
    contents: unknown[],
    key_fields: Path[] = [],
    search_targets: Path[] = [],
    field_names: FieldNameMap = {},
): UniIndex<LinearIndexEntry> | UniSearchError {
    try {
        if (!Array.isArray(contents)) throw new UniSearchError("unisearch: contents must be array.");
        if (contents.length === 0) throw new UniSearchError("unisearch: contents must not be empty.");

        // indexing for search
        const index_entry: LinearIndexEntry = {};
        if (search_targets.length !== 0) {
            contents.forEach((content, id) => {
                for (const path of search_targets) {
                    const obj = getValueByPath(path, content);
                    if (obj === undefined) throw new UniSearchError(`unisearch: cannot find path ${path}`);
                    if (typeof obj === "string") {
                        setEntry(index_entry, path, id, obj);
                    } else if (Array.isArray(obj)) {
                        setEntry(index_entry, path, id, obj.join(" "));
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
                        setEntry(index_entry, path, id, obj)
                    }
                }
            });
        } else {
            // indexing all, including key entries
            contents.forEach((content, id) => {
                for (const [path, obj] of extractStringsAll("", content)) {
                    setEntry(index_entry, path, id, obj);
                }
            });
        }

        return {
            version: Version,
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

function exactSearch(keyword: string, target: string): number[] {
    const result: number[] = [];
    let pos = target.indexOf(keyword);
    while (pos !== -1) {
        result.push(pos);
        pos = target.indexOf(keyword, pos + keyword.length + 1);
    }
    return result;
}

function fuzzySearch(keyword: string, target: string, maxerror: number): number[] {
    const key = createBitapKey(keyword);
    const result = [];
    let pos = bitapSearch(key, maxerror, target);
    while (pos !== null) {
        result.push(pos);
        pos = bitapSearch(key, 1, target, pos + keyword.length + 1);
    }
    return result;
}

export function linearExactSearch(query: string, index: UniSearchIndex<LinearIndexEntry>): SearchResult[] {
    const result = new Map<number, SearchResult>();
    for (const path of index.search_targets.length === 0 ? Object.keys(index.index_entry) : index.search_targets) {
        index.index_entry[path].forEach((text, id) => {
            const pos = exactSearch(query, text);
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
