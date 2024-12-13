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

function exactSearch(keyword: string, target: string): [number, number][] {
    const result: [number, number][] = [];
    let pos = target.indexOf(keyword);
    while (pos !== -1) {
        result.push([pos, 0]);
        pos = target.indexOf(keyword, pos + keyword.length + 1);
    }
    return result;
}

const fuzzySearch =
    (maxerror: number) =>
    (keyword: string, target: string): [number, number][] => {
        const key = createBitapKey(keyword);
        const result: [number, number][] = [];
        let pos = bitapSearch(key, maxerror, target);
        while (pos !== null) {
            result.push(pos);
            pos = bitapSearch(key, 1, target, pos[0] + keyword.length + 1);
        }
        return result;
    };

function searchToken(
    search_fn: (keyword: string, target: string) => [number, number][],
    token: string,
    index: UniSearchIndex<LinearIndexEntry>,
): SearchResult[] {
    const result = new Map<number, SearchResult>();

    // search all index
    index.index_entry.forEach((content, id) => {
        for (const path of index.search_targets.length === 0 ? Object.keys(content) : index.search_targets) {
            const search_target = content[path];
            const pos = search_fn(token, search_target);
            if (pos.length !== 0) {
                const cur = result.get(id) || {
                    id: id,
                    keys: index.key_fields.map((key) => index.index_entry[id][key]),
                    score: 0,
                    refs: [],
                };
                cur.refs = union(
                    cur.refs,
                    pos.map((p) => ({
                        token: token,
                        path: path,
                        pos: p[0],
                        wordaround: search_target.slice(Math.max(p[0] - 10, 0), p[0] + token.length + 10),
                        distance: p[1]
                    })),
                );
                result.set(id, cur);
            }
        }
    });

    // calculate score based on tf-idf
    const idf = Math.log(index.index_entry.length / (result.size + 1)) + 1;
    result.forEach((r) => {
        const tf = r.refs.map((v) => v.token.length / index.index_entry[r.id][v.path].length / (v.distance + 1)).reduce((x, y) => x + y);
        r.score = tf * idf;
    });

    return Array.from(result.values()).sort((a, b) => b.score - a.score);
}

export function linearExactSearch(query: string, index: UniSearchIndex<LinearIndexEntry>): SearchResult[] {
    return searchToken(exactSearch, query, index);
}

export function linearFuzzySearch(query: string, index: UniSearchIndex<LinearIndexEntry>): SearchResult[] {
    return searchToken(fuzzySearch(1), query, index);
}
