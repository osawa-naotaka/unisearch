import { bitapSearch, createBitapKey } from "@src/algorithm";
import type { Path, SearchResult, UniSearchIndex } from "@src/common";
import { searchSingle } from "@src/common";

type LinearIndexEntry = Record<Path, string[]>;

export function setLinearIndexEntry(index_entry: LinearIndexEntry, path: Path, id: number, str: string) {
    if (index_entry[path] === undefined) {
        index_entry[path] = [];
    }
    index_entry[path][id] = str;    
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

const fuzzySearch = (maxerror: number) => (keyword: string, target: string): number[] => {
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
    return searchSingle(exactSearch, query, index);
}

export function linearFuzzySearch(query: string, index: UniSearchIndex<LinearIndexEntry>): SearchResult[] {
    return searchSingle(fuzzySearch(1), query, index);
}
