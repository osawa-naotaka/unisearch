import type { Path, IndexOpt, SearchIndex, StaticIndex } from "@src/frontend/base";
import { StaticSeekError, Version, StaticIndex_z } from "@src/frontend/base";
import { IndexTypes } from "@src/frontend/indextypes";
import { defaultNormalizer, splitByGrapheme } from "@src/util/preprocess";
import { extractStringsAll, getValueByPath } from "@src/util/traverser";
import { ZodError, ZodObject } from "zod";

// biome-ignore lint: using any. fix it.
export type IndexClass = new (index?: any) => SearchIndex<any>;

export function createIndex<T, K extends ZodObject<any>>(
    index_class: IndexClass,
    contents: unknown[],
    opt: IndexOpt<K> = {},
): StaticIndex<SearchIndex<T>> | StaticSeekError {
    try {
        if (!Array.isArray(contents)) throw new StaticSeekError("staticseek: contents must be array.");
        if (contents.length === 0) throw new StaticSeekError("staticseek: contents must not be empty.");

        // indexing for search
        const search_index = new index_class();

        contents.forEach((content, id) => {
            if (opt.search_targets) {
                opt.search_targets.sort();
                // indexing required filed only
                for (const path of opt.search_targets) {
                    const obj = getValueByPath(path, content);
                    if (obj === undefined) continue;
                    if (typeof obj === "string") {
                        search_index.setToIndex(id, path, splitByGrapheme(defaultNormalizer(obj)));
                    } else if (Array.isArray(obj)) {
                        search_index.setToIndex(id, path, splitByGrapheme(defaultNormalizer(obj.join(" "))));
                    } else {
                        throw new StaticSeekError(`staticseek: ${path} is not string or array of string.`);
                    }
                }
            } else {
                // indexing all
                for (const [path, obj] of extractStringsAll("", content)) {
                    search_index.setToIndex(id, path, splitByGrapheme(defaultNormalizer(obj)));
                }
            }

            // register key entry
            if(opt.key_fields) {
                search_index.addKey(id, opt.key_fields.parse(content));
            }
        });

        // create field name map
        if (opt.field_names === undefined) {
            opt.field_names = {};
            for (const path of opt.search_targets || extractStringsAll("", contents[0]).map(([path]) => path)) {
                const name = nameOf(path);
                if (name !== undefined) {
                    opt.field_names[name] = path;
                }
            }
        }

        // fix index
        search_index.fixIndex();

        for (const [key, value] of Object.entries(IndexTypes)) {
            if (value === index_class) {
                return {
                    version: Version,
                    type: key,
                    env: { field_names: opt.field_names, search_targets: opt.search_targets, distance: opt.distance || 1, weight: opt.weight || 1},
                    index_entry: search_index,
                };
            }
        }
        throw new StaticSeekError("staticseek: index class not found.");
    } catch (e) {
        if (e instanceof StaticSeekError) {
            return e;
        } else if (e instanceof ZodError) {
            return new StaticSeekError(`StaticSeek createIndex: malformed format ${e.message}.`);
        }
        throw e;
    }
}

export function createIndexFromObject<T>(index: StaticIndex<T>): StaticIndex<SearchIndex<T>> | StaticSeekError {
    try {
        const parsed_index = StaticIndex_z.parse(index);
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
    } catch(e) {
        if(e instanceof ZodError) {
            return new StaticSeekError(`StaticSeek createIndexFromObject: malformed index ${e.message}.`);
        } else if(e instanceof StaticSeekError) {
            return e;
        }
        throw e;
    }
}

export function indexToObject<T>(index: StaticIndex<SearchIndex<T>>): StaticIndex<T> {
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
