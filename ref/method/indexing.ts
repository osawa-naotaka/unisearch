import type { SearchEnv, SearchIndex, StaticSeekIndexRoot } from "@ref/method/base";
import { type Path, StaticSeekError, Version } from "@ref/method/base";
import { IndexTypes } from "@ref/method/indextypes";
import { defaultNormalizer } from "@src/util/preprocess";
import { extractStringsAll, getValueByPath } from "@src/util/traverser";

// biome-ignore lint: using any. fix it.
export type IndexClass = new (index?: any) => SearchIndex<any>;

export function createIndex<T>(
    index_class: IndexClass,
    contents: unknown[],
    env: SearchEnv = {},
): StaticSeekIndexRoot<SearchIndex<T>> | StaticSeekError {
    try {
        if (!Array.isArray(contents)) throw new StaticSeekError("staticseek: contents must be array.");
        if (contents.length === 0) throw new StaticSeekError("staticseek: contents must not be empty.");

        // indexing for search
        const search_index = new index_class();

        contents.forEach((content, id) => {
            if (env.search_targets) {
                // indexing required filed only
                for (const path of env.search_targets) {
                    const obj = getValueByPath(path, content);
                    if (obj === undefined) continue;
                    if (typeof obj === "string") {
                        search_index.setToIndex(id, path, defaultNormalizer(obj));
                    } else if (Array.isArray(obj)) {
                        search_index.setToIndex(id, path, defaultNormalizer(obj.join(" ")));
                    } else {
                        throw new StaticSeekError(`staticseek: ${path} is not string or array of string.`);
                    }
                }
            } else {
                // indexing all
                for (const [path, obj] of extractStringsAll("", content)) {
                    search_index.setToIndex(id, path, defaultNormalizer(obj));
                }
            }

            // register key entry
            if (env.key_fields && env.key_fields.length !== 0) {
                const key: Record<Path, unknown> = {};
                for(const path of env.key_fields) {
                    const obj = getValueByPath(path, content);
                    key[path] = obj;
                }
                search_index.addKey(id, key);
            }
        });

        // create field name map
        if (env.field_names === undefined) {
            env.field_names = {};
            for (const path of env.search_targets || extractStringsAll("", contents[0]).map(([path]) => path)) {
                const name = nameOf(path);
                if (name !== undefined) {
                    env.field_names[name] = path;
                }
            }
        }

        // set default distance to 1
        if (env.distance === undefined) {
            env.distance = 1;
        }

        // fix index
        search_index.fixIndex();

        return {
            version: Version,
            type: index_class.name,
            env: env,
            index_entry: search_index,
        };
    } catch (e) {
        if (e instanceof StaticSeekError) {
            return e;
        }
        throw e;
    }
}

export function createIndexFromObject<T>(index: StaticSeekIndexRoot<T>): StaticSeekIndexRoot<SearchIndex<T>> {
    return {
        version: index.version,
        type: index.type,
        env: index.env,
        index_entry: new IndexTypes[index.type](index.index_entry),
    };
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
