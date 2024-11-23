import type { DocId, TrieNode, TrieIndex, InvertedIndexBase } from "@src/types";
import { firstLetter, restString, union, intersect } from "@src/util";
import { generateNgram } from "@src/ngram";
import { docToWords } from "@src/preprocess";

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

export function invertedIndexaLikeToTrieIndex<T extends keyof any>(iidx: InvertedIndexBase<T>) : TrieIndex {
    const index : TrieIndex = {
        ids: [],
        children: {}
    };

    for(const [token, docids] of Object.entries(iidx)) {
        createTrieNode(token, docids, index);
    }
    
    return index;
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

export function searchTrie(n: number, query: string, index: TrieIndex) : DocId[] {
    let result : DocId[] | null = null;
    for (const gram of docToWords([query]).flatMap(w => generateNgram(n, false, w))) {
        const docs = searchTrieNode(gram, index);
        if(docs) {
            if(result) {
                result = intersect(result, docs);
            } else {
                result = docs;
            }
        } else {
            return [];
        }
    }
    return result || [];
}



