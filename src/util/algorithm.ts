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
    if (array.length === 0) return null;
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

export type BitapKey<T> = {
    mask: Map<number, T>;
    length: number;
    and: (n1: T, n2: T) => T;
    or: (n1: T, n2: T) => T;
    to: (n: number) => T;
    sl: (n: T, shift: number) => T;
    sl1: (shift: number) => T;
};

export function bitapKeyBigint(): BitapKey<bigint> {
    return {
        mask: new Map<number, bigint>(),
        length: -1,
        and: (n1, n2) => n1 & n2,
        or: (n1, n2) => n1 | n2,
        to: (n) => BigInt(n),
        sl: (n, shift) => n << BigInt(shift),
        sl1: (shift) => 1n << BigInt(shift),
    };
}

export function bitapKeyNumber(): BitapKey<number> {
    return {
        mask: new Map<number, number>(),
        length: -1,
        and: (n1, n2) => n1 & n2,
        or: (n1, n2) => n1 | n2,
        to: (n) => n,
        sl: (n, shift) => n << shift,
        sl1: (shift) => 1 << shift,
    };
}

export function createBitapKey<T>(key: BitapKey<T>, pattern: string[]): BitapKey<T> {
    if (pattern.length > 32) throw new Error("createBitapKey: key length must be less than 32.");
    key.length = pattern.length;

    for (let i = 0; i < key.length; i++) {
        const char = pattern[i].charCodeAt(0);
        const bit = key.sl1(i);
        const old = key.mask.get(char);

        if (!old) {
            key.mask.set(char, bit);
        } else {
            key.mask.set(char, key.or(old, bit));
        }
    }

    return key;
}

export function bitapSearch<T>(key: BitapKey<T>, maxErrors: number, text: Uint32Array): [number, number][] {
    const state: T[] = Array(maxErrors + 1).fill(key.to(0));
    const matchbit = key.sl1(key.length - 1);
    const result: [number, number][] = [];

    const zero = key.to(0);
    const one = key.to(1);
    for (let i = 0; i < text.length; i++) {
        const mask = key.mask.get(text[i]) || zero;
        let replace = zero;
        let insertion = zero;
        let deletion = zero;

        for (let distance = 0; distance < maxErrors + 1; distance++) {
            const next_state_candidate = key.or(key.sl(state[distance], 1), one);
            const next_state = key.or(
                key.or(key.and(next_state_candidate, mask), replace),
                key.or(insertion, deletion),
            );

            replace = next_state_candidate;
            insertion = state[distance];
            deletion = key.or(key.sl(next_state, 1), one);

            state[distance] = next_state;

            if (key.and(state[distance], matchbit) !== zero) {
                result.push([i - key.length + 1, distance]);
                break;
            }
        }
    }

    // additional check for deletion
    for (let i = 0; i < maxErrors; i++) {
        let replace = zero;
        let insertion = zero;
        let deletion = zero;

        for (let distance = 0; distance < maxErrors + 1; distance++) {
            const next_state_candidate = key.or(key.sl(state[distance], 1), one);
            const next_state = key.or(key.or(replace, insertion), deletion);

            replace = next_state_candidate;
            insertion = state[distance];
            deletion = key.or(key.sl(next_state, 1), one);

            state[distance] = next_state;

            if (key.and(state[distance], matchbit) !== zero) {
                result.push([text.length - key.length, distance]);
                break;
            }
        }
    }

    return result;
}

export function union<T>(a: T[], b?: T[]): T[] {
    return b ? Array.from(new Set([...a, ...b])) : a;
}

type Pipe = {
    <A extends unknown[], B, C>(f: (...args: A) => B, g: (x: B) => C): (...args: A) => C;

    <A extends unknown[], B, C, D>(f: (...args: A) => B, g: (x: B) => C, h: (x: C) => D): (...args: A) => D;

    <A extends unknown[], B, C, D, E>(
        f: (...args: A) => B,
        g: (x: B) => C,
        h: (x: C) => D,
        i: (x: D) => E,
    ): (...args: A) => E;

    <A extends unknown[], B, C, D, E, F>(
        f: (...args: A) => B,
        g: (x: B) => C,
        h: (x: C) => D,
        i: (x: D) => E,
        j: (x: E) => F,
    ): (...args: A) => F;

    (...fns: AnyFunction[]): (...args: unknown[]) => unknown;
};

type AnyFunction = (...args: unknown[]) => unknown;

export const pipe: Pipe = (...fns: AnyFunction[]) => {
    return (...args: unknown[]) => {
        return fns.reduce((acc: unknown, fn, idx) => (idx === 0 ? fn(...args) : fn(acc)), null);
    };
};

export function generate1ToNgram(n: number, graphemes: string[]): string[] {
    return [...Array(n).keys()].flatMap((x) => generateNgramInternal(x + 1, graphemes));
}

export function generateNgram(n: number, graphemes: string[]): string[] {
    return graphemes.length < n ? [graphemes.join("")] : generateNgramInternal(n, graphemes);
}

export function generateNgramToTail(n: number, graphemes: string[]): string[] {
    const grams = generateNgram(n, graphemes);
    if (n < graphemes.length) {
        for (let i = graphemes.length - n; i < graphemes.length - 1; i++) {
            grams.push(graphemes.slice(i + 1).join(""));
        }
    } else if (graphemes.length !== 1) {
        for (let i = 1; i < graphemes.length; i++) {
            grams.push(graphemes.slice(i).join(""));
        }
    }
    return grams;
}

function generateNgramInternal(n: number, graphemes: string[]): string[] {
    if (graphemes.length === 0) throw new Error("call generateNgram with null string.");
    if (graphemes.length < n) {
        return [];
    }

    const grams: string[] = [];
    for (let i = 0; i <= graphemes.length - n; i++) {
        grams.push(graphemes.slice(i, i + n).join(""));
    }
    return grams;
}
