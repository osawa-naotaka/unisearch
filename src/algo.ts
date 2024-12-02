import type { Token } from "@src/common";
import { rangeArray } from "@src/util";

export function generate1ToNgram(n: number, text: string): Token[] {
    return rangeArray(n).flatMap((x) => generateNgramInternal(x + 1, text));
}

export function generateNgram(n: number, text: string): Token[] {
    return text.length < n ? [text] : generateNgramInternal(n, text);
}

export function generateNgramTrie(n: number, text: string): Token[] {
    const grams = generateNgram(n, text);
    if (n < text.length) {
        for (let i = text.length - n; i < text.length - 1; i++) {
            grams.push(text.slice(i + 1));
        }
    } else if (text.length !== 1) {
        for (let i = 1; i < text.length; i++) {
            grams.push(text.slice(i));
        }
    }
    return grams;
}

function generateNgramInternal(n: number, text: string): Token[] {
    if (text.length === 0) throw new Error("call generateNgram with null string.");
    if (text.length < n) {
        return [];
    }

    const grams: Token[] = [];
    for (let i = 0; i <= text.length - n; i++) {
        grams.push(text.slice(i, i + n));
    }
    return grams;
}

export function compose<T>(...fns: ((arg: T) => T)[]): (arg: T) => T {
    return (arg: T) => fns.reduce((val, f) => f(val), arg);
}

export function intersect<T>(a: T[], b: T[], equals = (a: T, b: T) => a === b): T[] {
    return a.filter((x) => b.filter((y) => equals(x, y)).length !== 0);
}

export function union<T>(a: T[], b?: T[]): T[] {
    return b ? Array.from(new Set([...a, ...b])) : a;
}

export function difference<T>(a: T[], b: T[], equals = (a: T, b: T) => a === b): T[] {
    return a.filter((x) => b.filter((y) => equals(x, y)).length === 0);
}

export function appendIfNotExists<T>(item: T, array?: T[]): T[] {
    return array ? Array.from(new Set([...array, item])) : [item];
}

export function zipWith<T, U, V>(a: T[], b: U[], combine: (a: T, b: U) => V): V[] {
    const minLength = Math.min(a.length, b.length);
    const result: V[] = [];

    for (let i = 0; i < minLength; i++) {
        result.push(combine(a[i], b[i]));
    }

    return result;
}

export function zipWith3<T, U, V, R>(a: T[], b: U[], c: V[], combine: (a: T, b: U, c: V) => R): R[] {
    const minLength = Math.min(a.length, b.length, c.length);
    const result: R[] = [];

    for (let i = 0; i < minLength; i++) {
        result.push(combine(a[i], b[i], c[i]));
    }

    return result;
}

export function zipWith4<T, U, V, W, R>(a: T[], b: U[], c: V[], d: W[], combine: (a: T, b: U, c: V, d: W) => R): R[] {
    const minLength = Math.min(a.length, b.length, c.length, d.length);
    const result: R[] = [];

    for (let i = 0; i < minLength; i++) {
        result.push(combine(a[i], b[i], c[i], d[i]));
    }

    return result;
}

export function foldl<T>(fn: (acc: T, cur: T) => T, array: T[], initial: T) {
    let acc = initial;
    for (let i = 0; i < array.length; i++) {
        acc = fn(acc, array[i]);
    }

    return acc;
}

export function foldl1<T>(fn: (acc: T, cur: T) => T, array: T[]): T {
    if (array.length === 0) {
        throw new Error("foldl1 cannot be called on an empty array.");
    }

    let acc = array[0];
    for (let i = 1; i < array.length; i++) {
        acc = fn(acc, array[i]);
    }

    return acc;
}

export function foldl1Array<T>(fn: (acc: T[], cur: T[]) => T[], array: T[][]): T[] {
    return array.length === 0 ? [] : array.length === 1 ? array[0] : foldl1(fn, array);
}

export const BinarySearchType = {
    Exact: 0,
    FindStart: 1,
    FindEnd: 2,
} as const;

export type BinarySearchType = (typeof BinarySearchType)[keyof typeof BinarySearchType];

export function binarySearch<T>(
    key: T,
    comp: (a: T, b: T) => number,
    array: T[],
    type: BinarySearchType,
): number | null {
    let left = 0;
    let right = array.length - 1;
    let match: number | null = null;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const r = comp(key, array[mid]);

        if (r === 0) {
            switch (type) {
                case BinarySearchType.Exact:
                    return mid;
                case BinarySearchType.FindStart:
                    match = mid;
                    right = mid - 1;
                    break;
                case BinarySearchType.FindEnd:
                    match = mid;
                    left = mid + 1;
                    break;
            }
        } else {
            if (r > 0) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }

    return match;
}

export function refine<T>(key: T, comp: (a: T, b: T) => number, array: T[]): T[] {
    const startIndex = binarySearch(key, comp, array, BinarySearchType.FindStart);
    const endIndex = binarySearch(key, comp, array, BinarySearchType.FindEnd);

    return startIndex !== null && endIndex !== null ? array.slice(startIndex, endIndex + 1) : [];
}

type BitapKey = {
    mask: Map<string, number>;
    length: number;
};

type BitapResult = {
    found: boolean;
    position: number;
    errors: number;
};

export function createBitapKey(pattern: string): BitapKey {
    const key: BitapKey = {
        mask: new Map<string, number>(),
        length: pattern.length,
    };

    for (let i = 0; i < key.length; i++) {
        const char = pattern[i];
        const bit = 1 << i;
        const old = key.mask.get(char);

        if (!old) {
            key.mask.set(char, bit);
        } else {
            key.mask.set(char, old | bit);
        }
    }

    return key;
}

export function bitapSearch(key: BitapKey, maxErrors: number, text: string, pos: number = 0): BitapResult {
    const R = Array(maxErrors + 1).fill(~1);

    for (let i = pos; i < text.length; i++) {
        const oldR = [...R];

        const charMask = key.mask.get(text[i]) || 0;

        for (let d = 0; d <= maxErrors; d++) {
            const insertion = oldR[d] << 1;
            const deletion = oldR[d - 1] || ~1;
            const match = oldR[d - 1] | charMask;

            R[d] = (insertion | deletion | match) & ~1;
        }

        const patternBit = 1 << (key.length - 1);

        for (let d = 0; d <= maxErrors; d++) {
            if ((R[d] & patternBit) !== 0) {
                return {
                    found: true,
                    position: i - key.length + 1,
                    errors: d,
                };
            }
        }
    }

    return { found: false, position: -1, errors: -1 };
}
