import type { DocId, Token } from "@src/common";
import { firstLetter, restString, union } from "@src/util";

type TrieNode = {
    ids: DocId[];
    children: Record<string, TrieNode>;
};

export type TrieIndex = TrieNode;

function createTrieNode(token: Token, ids: DocId[], node: TrieNode): TrieNode {
    if (token.length === 0) {
        return node;
    }

    const first_letter = firstLetter(token);
    const child = node.children[first_letter];
    let new_child: TrieNode;
    if (child) {
        new_child = child;
        new_child.ids = union(new_child.ids, ids);
    } else {
        new_child = {
            ids: ids,
            children: {},
        };
    }

    node.children[first_letter] = createTrieNode(restString(token), ids, new_child);
    return node;
}

function searchTrieNode(token: Token, node: TrieIndex): number[] {
    if (token.length === 0) {
        return node.ids;
    }
    const first_letter = firstLetter(token);
    const child = node.children[first_letter];
    if (!child) {
        return [];
    }
    return searchTrieNode(restString(token), child);
}

export function addToTrieIndex(docid: DocId, text: Token, index: TrieIndex) {
    createTrieNode(text, [docid], index);
}

export function searchTrie(query: Token, index: TrieIndex): DocId[] {
    return searchTrieNode(query, index);
}
