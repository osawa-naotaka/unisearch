import { SearchIndex, Path, SearchEnv, SearchResult } from "@src/frontend/base";
import { splitByGrapheme } from "@src/util/preprocess";

type Id = number;
type TF = number;
type PostingListEntry = [Id, TF]
type PostingList = PostingListEntry[];

type TrieNode = {
    children?: TrieChildren;
    postinglist?: PostingList;
};

type TrieChildren = Record<string, TrieNode>;

type TrieIndexEntry = {
    index: Record<Path, TrieNode>;
    key: Record<string, unknown>[];
}

export class TrieIndex implements SearchIndex<TrieIndexEntry> {
    public readonly index_entry: TrieIndexEntry;

    constructor(index?: TrieIndexEntry) {
        this.index_entry = index || { key: [], index: { } };
    }

    public setToIndex(id: Id, path: Path, str: string): void {
        const term = splitByGrapheme(str);
        const base_node = this.index_entry.index[path] || {};
        this.index_entry.index[path] = this.updateTrieNode(base_node, term, id);
    }
    
    public addKey(id: number, key: Record<Path, unknown>): void {
        this.index_entry.key[id] = key;
    }
    
    public fixIndex(): void { }
    
    public async search(env: SearchEnv, keyword: string): Promise<SearchResult[]> {
        const grapheme = splitByGrapheme(keyword);
        if(grapheme.length === 0) {
            return [];
        }

        const results = new Map<Id, SearchResult>();
        for (const path of env.search_targets || Object.keys(this.index_entry.index)) {
            const plist = this.searchTrie(this.index_entry.index[path], grapheme, env.distance || 0);
            for (const [id, tf] of plist) {
                const r = results.get(id) || { id: id, key: this.index_entry.key[id] || {}, score: 0, refs: [] };
                r.refs.push({ token: keyword, path: path, distance: 0 });
                r.score += tf;
                results.set(id, r);
            }
        }
        return Array.from(results.values());
    }

    private updateTrieNode(node: TrieNode, term: string[], id: Id): TrieNode {
        const node_char = term[0];
        if(term.length === 1) {
            // leaf
            const children = node.children || {};
            const leaf = children[node_char] || {};
            if(leaf.postinglist === undefined) {
                leaf.postinglist = [];
            }
            const plist_index = leaf.postinglist.findIndex((p) => p[0] === id);
            const plist: PostingListEntry = [id, plist_index !== -1 ? leaf.postinglist[plist_index][1] + 1 : 1];

            if(plist_index === -1) {
                leaf.postinglist.push(plist)
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

        return { children: children, postinglist: node.postinglist }
    }

    private searchTrie(node: TrieNode, keyword: string[], distance_left: number): PostingList {
        const char = keyword[0];
        if(keyword.length === 1) {
            const find_node = node.children?.[char];
            return find_node ? this.getAllPostingList(find_node) : [];
        }
        const child = node.children?.[char];
        if(child === undefined) {
            return [];
        }
        return this.searchTrie(child, keyword.slice(1), distance_left);
    }

    private getAllPostingList(node: TrieNode): PostingList {
        let result: PostingList = [];
        if(node.postinglist) {
            result = result.concat(node.postinglist);
        }
        if(node.children) {
            for(const child_node of Object.values(node.children)) {
                const child_result = this.getAllPostingList(child_node);
                if(child_node) {
                    result = result.concat(child_result);
                }
            }    
        }

        return result;
    }
};
