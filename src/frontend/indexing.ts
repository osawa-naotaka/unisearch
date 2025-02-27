import type { FieldNameMap, IndexOpt, Path, SearchIndex, StaticSeekIndexRoot } from "@src/frontend/base";
import { StaticSeekError, StaticSeekIndexRoot_v, Version } from "@src/frontend/base";
import { IndexTypes } from "@src/frontend/indextypes";
import { defaultNormalizer, splitByGrapheme } from "@src/util/preprocess";
import { extractStringsAll, getValueByPath, setObject } from "@src/util/traverser";
import * as v from "valibot";

// biome-ignore lint: using any. fix it.
export type IndexClass = new (index?: any) => SearchIndex<any>;

export function createIndex<T>(
    index_class: IndexClass,
    contents: unknown[],
    opt: IndexOpt = {},
): StaticSeekIndexRoot<SearchIndex<T>> | StaticSeekError {
    try {
        if (!Array.isArray(contents)) throw new StaticSeekError("staticseek: contents must be array.");
        if (contents.length === 0) throw new StaticSeekError("staticseek: contents must not be empty.");

        const search_index = new index_class();
        const field_names: FieldNameMap = {};

        // indexing for search
        contents.forEach((content, id) => {
            if (opt.search_targets) {
                opt.search_targets.sort();
                // indexing required filed only
                for (const path of opt.search_targets) {
                    const path_obj = getValueByPath(path, content);
                    if (path_obj === undefined) continue;
                    for (const [single_path, single_obj] of extractStringsAll(path, path_obj)) {
                        search_index.setToIndex(id, single_path, splitByGrapheme(defaultNormalizer(single_obj)));

                        // register field name map
                        const name = nameOf(path);
                        if (name !== undefined) {
                            field_names[name] = path;
                        }
                    }
                }
            } else {
                // indexing all
                for (const [path, obj] of extractStringsAll("", content)) {
                    search_index.setToIndex(id, path, splitByGrapheme(defaultNormalizer(obj)));

                    // register field name map
                    const name = nameOf(path);
                    if (name !== undefined) {
                        field_names[name] = path;
                    }
                }
            }

            // register key entry
            if (opt.key_fields && opt.key_fields.length !== 0) {
                const key: Record<string, unknown> = {};
                for (const path of opt.key_fields) {
                    const obj = getValueByPath(path, content);
                    setObject(key, path, obj);
                }
                search_index.addKey(id, key);
            }
        });

        // fix index
        search_index.fixIndex();

        // create index object
        for (const [key, value] of Object.entries(IndexTypes)) {
            if (value === index_class) {
                // create weights array
                const weights = (opt.weights || []).map(([path, weight]): [Path, number] => [
                    field_names[path] || path,
                    weight,
                ]);
                weights.push(["", 1]); // default weight is last element
                return {
                    version: Version,
                    type: key,
                    env: {
                        // search_targets is not included because only specified fields are indexed
                        field_names: field_names,
                        distance: opt.distance || 1,
                        weights: weights,
                    },
                    index_entry: search_index,
                };
            }
        }
        throw new StaticSeekError("staticseek: index class not found.");
    } catch (e) {
        if (e instanceof StaticSeekError) {
            return e;
        }
        if (e instanceof v.ValiError) {
            return new StaticSeekError(`StaticSeek createIndex: malformed format ${e.message}.`);
        }
        throw e;
    }
}

export function createIndexFromObject<T>(
    index: StaticSeekIndexRoot<T>,
): StaticSeekIndexRoot<SearchIndex<T>> | StaticSeekError {
    try {
        const parsed_index = v.parse(StaticSeekIndexRoot_v, index);
        if (parsed_index.version !== Version)
            return new StaticSeekError(
                `Older versions of the index are used. Please rebuild the index with version ${Version}.`,
            );
        return {
            version: parsed_index.version,
            type: parsed_index.type,
            env: parsed_index.env,
            index_entry: new IndexTypes[index.type](parsed_index.index_entry),
        };
    } catch (e) {
        if (e instanceof v.ValiError) {
            return new StaticSeekError(`StaticSeek createIndexFromObject: malformed index ${e.message}.`);
        }
        if (e instanceof StaticSeekError) {
            return e;
        }
        throw e;
    }
}

export function indexToObject<T>(index: StaticSeekIndexRoot<SearchIndex<T>>): StaticSeekIndexRoot<T> {
    return {
        version: index.version,
        type: index.type,
        env: index.env,
        index_entry: index.index_entry.index_entry,
    };
}

function nameOf(path: Path): string | undefined {
    return path.split(".").pop();
}
