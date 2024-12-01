import type { Reference, Token } from "@src/common";
import { appendIfNotExists, binarySearch, compareWithUnicode } from "@src/util";

export type SortedArrayIndex = {
    unsorted: Record<Token, Reference[]>;
    sorted: [Token, Reference[]][];
};

export function refineSortedArray<T>(prefix: string, keyof: (item: T) => string, items: T[]): T[] {

    function findStartIndex(items: T[], prefix: string): number | null {
        let left = 0;
        let right = items.length - 1;
        let match = null;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const key = keyof(items[mid]);
            if(key.startsWith(prefix)) {
                match = mid;
            }
            if (key < prefix) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return match;
    };

    function findEndIndex(items: T[], prefix: string): number | null {
        let left = 0;
        let right = items.length - 1;
        let match = null;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const key = keyof(items[mid]);
            if(key.startsWith(prefix)) {
                match = mid;
                if (key < prefix) {
                    right = mid - 1;
                } else {
                    left = mid + 1;
                }
            } else {
                if (key < prefix) {
                    left = mid + 1;
                } else {
                    right = mid - 1;
                }    
            }
        }
        
        return match;
    };

    const startIndex = findStartIndex(items, prefix);
    const endIndex = findEndIndex(items, prefix);

    return startIndex !== null && endIndex !== null ? items.slice(startIndex, endIndex + 1) : [];
}

export function addToSortedArrayIndex(ref: Reference, text: Token, index: SortedArrayIndex) {
    index.unsorted[text] = appendIfNotExists(ref, index.unsorted[text]);
}

export function createSortedArrayIndex(index: SortedArrayIndex) {
    index.sorted = Object.entries(index.unsorted).sort(([a], [b]) => compareWithUnicode(a, b));
    index.unsorted = {};
}

export function searchExactSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    const pos = binarySearch(index.sorted, [query, []], ([x],  [y]) => compareWithUnicode(x, y));
    return pos ? index.sorted[pos][1] : [];
}

export function searchForwardSortedArray(query: Token, index: SortedArrayIndex): Reference[] {
    const items = refineSortedArray(query, (x) => x[0], index.sorted);

    return Array.from(new Set([...items.flatMap(([_, refs]) => refs)]));
}
