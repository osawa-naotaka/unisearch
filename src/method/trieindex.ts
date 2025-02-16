import { SearchIndex, Path, SearchEnv, SearchResult } from "@src/frontend/base";
import { splitByGrapheme } from "@src/util/preprocess";

type Id = number;
type TF = number;
type Distance = number;
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
            for (const [[id, tf], distance_left] of plist) {
                const r = results.get(id) || { id: id, key: this.index_entry.key[id] || {}, score: 0, refs: [] };
                const distance = (env.distance || 0) - distance_left; 
                r.refs.push({ token: keyword, path: path, distance: distance });
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

    private searchTrie(node: TrieNode, keyword: string[], distance_left: Distance): [PostingListEntry, Distance][] {
        const exact = this.searchTrieExact(node, keyword, distance_left);

        if(distance_left === 0) {
            return exact;
        }

        if(!node.children) {
            return node.postinglist?.map((p) => [p, distance_left]) || [];
        }

        const dist = distance_left - 1;
        const children = Object.values(node.children);

        const replace = children.map((n) => this.searchTrie(n, keyword.slice(1), dist));
        const insertion = children.map((n) => this.searchTrie(n, keyword, dist));
        const deletion = this.searchTrie(node, keyword.slice(1), dist);

        return exact.concat(...replace, ...insertion, deletion);
    }

    private searchTrieExact(node: TrieNode, keyword: string[], distance_left: Distance): [PostingListEntry, Distance][] {
        const char = keyword[0];
        if(keyword.length === 1) {
            const find_node = node.children?.[char];
            return find_node ? this.getAllPostingList(find_node, distance_left) : [];
        }
        const child = node.children?.[char];
        if(child === undefined) {
            return [];
        }
        return this.searchTrie(child, keyword.slice(1), distance_left);
    }

    private getAllPostingList(node: TrieNode, distance_left: Distance): [PostingListEntry, Distance][] {
        let result: [PostingListEntry, Distance][] = [];
        if(node.postinglist) {
            result = result.concat(node.postinglist.map((p) => [p, distance_left]));
        }
        if(node.children) {
            for(const child_node of Object.values(node.children)) {
                const child_result = this.getAllPostingList(child_node, distance_left);
                if(child_node) {
                    result = result.concat(child_result);
                }
            }    
        }

        return result;
    }
};
