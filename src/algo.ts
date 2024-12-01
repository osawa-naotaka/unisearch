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

export function binarySearch<T>(items: T[], target: T, comp: (a: T, b: T) => number): number | null {
    let left = 0;
    let right = items.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const r = comp(items[mid], target);

        if (r === 0) {
            return mid;
        }

        if (r < 0) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return null;
}

export function refine<T>(prefix: string, keyof: (item: T) => string, items: T[]): T[] {
    function findStartIndex(items: T[], prefix: string): number | null {
        let left = 0;
        let right = items.length - 1;
        let match = null;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const key = keyof(items[mid]);
            if (key.startsWith(prefix)) {
                match = mid;
            }
            if (key < prefix) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return match;
    }

    function findEndIndex(items: T[], prefix: string): number | null {
        let left = 0;
        let right = items.length - 1;
        let match = null;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const key = keyof(items[mid]);
            if (key.startsWith(prefix)) {
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
    }

    const startIndex = findStartIndex(items, prefix);
    const endIndex = findEndIndex(items, prefix);

    return startIndex !== null && endIndex !== null ? items.slice(startIndex, endIndex + 1) : [];
}
