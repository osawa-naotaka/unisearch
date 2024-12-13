import { bitapSearch, createBitapKey, union } from "@src/algorithm";
import type { Path, SearchResult, UniSearchIndex } from "@src/common";
import { defaultNormalizer } from "@src/preprocess";

export type LinearIndexEntry = Record<Path, string>[];

export function setLinearIndexEntry(index_entry: LinearIndexEntry, path: Path, id: number, str: string) {
    if (index_entry[id] === undefined) {
        index_entry[id] = {};
    }
    index_entry[id][path] = defaultNormalizer(str);
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

const fuzzySearch =
    (maxerror: number) =>
    (keyword: string, target: string): number[] => {
        const key = createBitapKey(keyword);
        const result = [];
        let pos = bitapSearch(key, maxerror, target);
        while (pos !== null) {
            result.push(pos);
            pos = bitapSearch(key, 1, target, pos + keyword.length + 1);
        }
        return result;
    };

function searchToken(
    search_fn: (keyword: string, target: string) => number[],
    token: string,
    index: UniSearchIndex<LinearIndexEntry>,
): SearchResult[] {
    const result = new Map<number, SearchResult>();
    index.index_entry.forEach((content, id) => {
        for (const path of index.search_targets.length === 0 ? Object.keys(content) : index.search_targets) {
            const pos = search_fn(token, content[path]);
            if (pos.length !== 0) {
                const cur = result.get(id) || {
                    index: id,
                    keys: index.key_fields.map((key) => index.index_entry[id][key]),
                    score: 0,
                    refs: [],
                };
                cur.refs = union(
                    cur.refs,
                    pos.map((p) => ({
                        token: token,
                        path: path,
                        pos: p,
                        wordaround: content[path].slice(p - 10, p + token.length + 10),
                    })),
                );
                result.set(id, cur);
            }
        }
    });
    return Array.from(result.values());
}

export function linearExactSearch(query: string, index: UniSearchIndex<LinearIndexEntry>): SearchResult[] {
    return searchToken(exactSearch, query, index);
}

export function linearFuzzySearch(query: string, index: UniSearchIndex<LinearIndexEntry>): SearchResult[] {
    return searchToken(fuzzySearch(1), query, index);
}
