import type { DocId, TrieIndex, TrieNode } from "@src/types";
import { firstLetter, restString, union } from "@src/util";

function createTrieNode(token: string, ids: DocId[], node: TrieNode): TrieNode {
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

function searchTrieNode(token: string, node: TrieIndex): number[] {
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

export function docToTrieIndex(docid: DocId, doc: string, index: TrieIndex): TrieIndex {
    createTrieNode(doc, [docid], index);
    return index;
}

export function searchTrie(query: string, index: TrieIndex): DocId[] {
    return searchTrieNode(query, index);
}
