import type { LinearSearchIndex } from "@src/indexing";
import type { Path } from "@src/indexing";
import { extractStrings } from "@src/traverser";
import { bitapSearch, createBitapKey } from "@src/algorithm";

function* fuzzyIndicesOf(keyword: string, target: string): Generator<number> {
    const key = createBitapKey(keyword);
    let pos = bitapSearch(key, 1, target);
    while (pos !== null) {
        yield pos;
        pos = bitapSearch(key, 1, target, pos + keyword.length + 1);
    }
}

type Reference = {
    pos: number;
    wordaround: string;
};

type SearchResult = {
    index: number,
    keys: Path[],
    score: number,

};

export function linearSearch<T>(query: string, index: LinearSearchIndex<T>) {
    for(const [path, content] of extractStrings("", index.contents)) {
        const pos = fuzzyIndicesOf(query, content)
    }
}
