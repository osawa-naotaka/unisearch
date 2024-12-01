import type { Reference, Token } from "@src/common";
import { appendIfNotExists, binarySearch, compareWithUnicode } from "@src/util";

export type SortedArrayIndex = {
    unsorted: Record<Token, Reference[]>;
    sorted: [Token, Reference[]][];
};

function refineSortedArray<T>(prefix: string, keyof: (item: T) => string, items: T[]): T[] {

    function findStartIndex(items: T[], prefix: string): number  {
        let left = 0;
        let right = items.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (keyof(items[mid]) < prefix) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return left;
    };

    function findEndIndex(items: T[], prefix: string): number {
        let left = 0;
        let right = items.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (prefix < keyof(items[mid])) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        
        return right;
    };

    const startIndex = findStartIndex(items, prefix);
    const endIndex = findEndIndex(items, prefix);

    if (startIndex >= items.length || !keyof(items[startIndex]).startsWith(prefix)) {
        return [];
    }

    return items.slice(startIndex, endIndex + 1);
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
