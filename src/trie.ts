import type { Reference, Scheme, Token } from "@src/common";
import { firstLetter, restString, union } from "@src/util";

type TrieNode = {
    refs: Reference[];
    children: Record<string, TrieNode>;
};

export type TrieIndex = TrieNode;

function createTrieNode(token: Token, refs: Reference[], node: TrieNode): TrieNode {
    if (token.length === 0) {
        return node;
    }

    const first_letter = firstLetter(token);
    const child = node.children[first_letter];
    let new_child: TrieNode;
    if (child) {
        new_child = child;
        new_child.refs = union(new_child.refs, refs);
    } else {
        new_child = {
            refs: refs,
            children: {},
        };
    }

    node.children[first_letter] = createTrieNode(restString(token), refs, new_child);
    return node;
}

function searchTrieNode(token: Token, node: TrieIndex): Reference[] {
    if (token.length === 0) {
        return node.refs;
    }
    const first_letter = firstLetter(token);
    const child = node.children[first_letter];
    if (!child) {
        return [];
    }
    return searchTrieNode(restString(token), child);
}

export function addToTrieIndex(ref: Reference, text: Token, index: TrieIndex) {
    createTrieNode(text, [ref], index);
}

export function searchTrie(scheme: Scheme, query: Token, index: TrieIndex): Reference[] {
    if (scheme === "EXACT") throw new Error("searchTrie: EXACT is not implemented yet.");
    if (scheme === "FUZZY") throw new Error("searchTrie: FUZZY is not implemented yet.");
    return searchTrieNode(query, index);
}
