import { bitapSearch, createBitapKey } from "@src/algorithm";
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
    distance: number,
    token: string,
    index: UniSearchIndex<LinearIndexEntry>,
): SearchResult[] {
    const result: Map<number, SearchResult>[] = [];
    for (let i = 0; i < distance + 1; i++) {
        result[i] = new Map<number, SearchResult>();
    }

    // search all index
    index.index_entry.forEach((content, id) => {
        for (const path of index.search_targets.length === 0 ? Object.keys(content) : index.search_targets) {
            const search_target = content[path];
            const poses = search_fn(token, search_target);
            if (poses.length !== 0) {
                for (const [pos, dist] of poses) {
                    const cur = result[dist].get(id) || {
                        id: id,
                        keys: index.key_fields.map((key) => index.index_entry[id][key]),
                        score: 0,
                        refs: [],
                    };
                    cur.refs.push({
                        token: token,
                        path: path,
                        pos: pos,
                        wordaround: search_target.slice(Math.max(pos - 10, 0), pos + token.length + 10),
                        distance: dist,
                    });
                    result[dist].set(id, cur);
                }
            }
        }
    });

    let sorted_result: SearchResult[] = [];
    for (let i = 0; i < distance + 1; i++) {
        // calculate score based on tf-idf
        const idf = Math.log(index.index_entry.length / (result[i].size + 1)) + 1;
        for (const [_, r] of result[i]) {
            const tf = r.refs
                .map((v) => v.token.length / index.index_entry[r.id][v.path].length / (v.distance + 1))
                .reduce((x, y) => x + y);
            r.score = tf * idf;
        }

        // add sorted results
        sorted_result = sorted_result.concat(Array.from(result[i].values()).sort((a, b) => b.score - a.score));

        // remove ids of sorted results from far results.
        for (let j = i + 1; j < distance + 1; j++) {
            for (const [_, r] of result[i]) {
                result[j].delete(r.id);
            }
        }
    }

    return sorted_result;
}

export const linearExactSearch = (index: UniSearchIndex<LinearIndexEntry>) => (query: string) : SearchResult[] => {
    return searchToken(exactSearch, 0, query, index);
}

export const linearFuzzySearch =
    (index: UniSearchIndex<LinearIndexEntry>) =>
    (distance: number) =>
    (query: string): SearchResult[] => {
        return searchToken(fuzzySearch(distance), distance, query, index);
    };
