import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import * as v from "valibot";

const Id_v = v.number();
const TF_v = v.number();
const PostingListEntry_v = v.tuple([Id_v, TF_v]);
const PostingList_v = v.array(PostingListEntry_v);

type Id = v.InferOutput<typeof Id_v>;
type TF = v.InferOutput<typeof TF_v>;
type Distance = number;
type PostingListEntry = v.InferOutput<typeof PostingListEntry_v>;
type PostingList = v.InferOutput<typeof PostingList_v>;

type TrieNode = {
    children?: Record<string, TrieNode>;
    postinglist?: PostingList;
};

const TrieNode_v: v.GenericSchema<TrieNode> = v.object({
    children: v.optional(
        v.record(
            v.string(),
            v.lazy(() => TrieNode_v),
        ),
    ),
    postinglist: v.optional(PostingList_v),
});

const TrieIndexEntry_v = v.object({
    index: v.record(v.string(), TrieNode_v),
    key: v.array(v.record(v.string(), v.unknown())),
});

type TrieIndexEntry = v.InferOutput<typeof TrieIndexEntry_v>;

type TrieSearchResult = {
    id: Id;
    tf: TF;
    term: string;
    distance_left: number;
};

export class TrieIndex implements SearchIndex<TrieIndexEntry> {
    public readonly index_entry: TrieIndexEntry;

    constructor(index?: TrieIndexEntry) {
        this.index_entry = index ? v.parse(TrieIndexEntry_v, index) : { key: [], index: {} };
    }

    public setToIndex(id: Id, path: Path, str: string[]): void {
        const base_node = this.index_entry.index[path] || {};
        this.index_entry.index[path] = this.updateTrieNode(base_node, str, id);
    }

    public addKey(id: number, key: Record<Path, unknown>): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {}

    public async search(env: SearchEnv, keyword: string[]): Promise<SearchResult[]> {
        if (keyword.length === 0) {
            return [];
        }

        const results = new Map<Id, SearchResult>();
        for (const path of env.search_targets || Object.keys(this.index_entry.index)) {
            const tsr = this.searchTrie(this.index_entry.index[path], keyword, [], env.distance || 0);

            const term_dict: Map<Id, TrieSearchResult[]> = new Map();
            for (const t of tsr) {
                const entry = term_dict.get(t.id);
                if (entry) {
                    const pos = entry.findIndex((e) => e.term === t.term);
                    if (pos >= 0) {
                        entry[pos].distance_left = Math.max(t.distance_left, entry[pos].distance_left);
                    } else {
                        entry.push(t);
                    }
                    term_dict.set(t.id, entry);
                } else {
                    term_dict.set(t.id, [t]);
                }
            }

            for (const [id, tsr] of term_dict.entries()) {
                const r = results.get(id) || { id: id, key: this.index_entry.key[id] || {}, score: 0, refs: [] };
                for (const res of tsr) {
                    const distance = (env.distance || 0) - res.distance_left;
                    r.refs.push({ token: res.term, path: path, distance: distance });
                    r.score += res.tf;
                    results.set(res.id, r);
                }
            }
        }
        return Array.from(results.values());
    }

    private updateTrieNode(node: TrieNode, term: string[], id: Id): TrieNode {
        const node_char = term[0];
        if (term.length === 1) {
            // leaf
            const children = node.children || {};
            const leaf = children[node_char] || {};
            if (leaf.postinglist === undefined) {
                leaf.postinglist = [];
            }
            const plist_index = leaf.postinglist.findIndex((p) => p[0] === id);
            const plist: PostingListEntry = [id, plist_index !== -1 ? leaf.postinglist[plist_index][1] + 1 : 1];

            if (plist_index === -1) {
                leaf.postinglist.push(plist);
            } else {
                leaf.postinglist[plist_index] = plist;
            }
            children[node_char] = leaf;
            node.children = children;

            return node;
        }

        // node
        const children = node.children || {};
        const target_node = children[node_char] || {};

        children[node_char] = this.updateTrieNode(target_node, term.slice(1), id);

        return { children: children, postinglist: node.postinglist };
    }

    private searchTrie(
        node: TrieNode,
        keyword: string[],
        matched: string[],
        distance_left: Distance,
    ): TrieSearchResult[] {
        if (keyword.length === 0) {
            return this.getAllPostingList(node, matched, distance_left);
        }

        // exact
        const char = keyword[0];
        const rest = keyword.slice(1);
        const find_node = node.children?.[char];
        const exact = find_node ? this.searchTrie(find_node, rest, matched.concat(char), distance_left) : [];

        if (distance_left === 0) {
            return exact;
        }

        // fuzzy: deletion
        const dist = distance_left - 1;
        const deletion = this.searchTrie(node, rest, matched, dist);
        if (!node.children) {
            return exact.concat(deletion);
        }

        // fuzzy: replace, insertion, deletion
        const children = Object.entries(node.children);
        const replace = children
            .map(([s, n]) => this.searchTrie(n, rest, matched.concat(s), dist))
            .filter((x) => x.length !== 0);
        const insertion = children
            .map(([_s, n]) => this.searchTrie(n, keyword, matched, dist))
            .filter((x) => x.length !== 0);

        return exact.concat(deletion, ...replace, ...insertion);
    }

    private getAllPostingList(node: TrieNode, matched: string[], distance_left: Distance): TrieSearchResult[] {
        let result: TrieSearchResult[] = [];
        if (node.postinglist) {
            result = result.concat(
                node.postinglist.map((p) => ({
                    id: p[0],
                    tf: p[1],
                    term: matched.join(""),
                    distance_left: distance_left,
                })),
            );
        }
        if (node.children) {
            for (const [char, child_node] of Object.entries(node.children)) {
                const child_result = this.getAllPostingList(child_node, matched.concat(char), distance_left);
                if (child_node) {
                    result = result.concat(child_result);
                }
            }
        }

        return result;
    }
}
