import { bitapSearch, createBitapKey, union } from "@src/algorithm";
import type { LinearSearchIndex } from "@src/indexing";
import type { Path } from "@src/indexing";

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

type Reference = {
    path: Path;
    pos: number;
    wordaround: string;
};

type SearchResult = {
    query: string;
    index: number;
    keys: any;
    score: number;
    refs: Reference[];
};

export function linearExactSearch(query: string, index: LinearSearchIndex): SearchResult[] {
    const result = new Map<number, SearchResult>();
    for (const path of index.search_targets.length === 0 ? Object.keys(index.index_entry) : index.search_targets) {
        index.index_entry[path].forEach((text, id) => {
            const pos = exactSearch(query, text);
            if (pos.length !== 0) {
                const cur = result.get(id) || {
                    query: query,
                    index: id,
                    keys: index.key_fields.map((key) => index.index_entry[key]),
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
