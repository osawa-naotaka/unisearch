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
    if(array.length === 0) return null;
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

export function createBitapKey(pattern: string): BitapKey {
    if (pattern.length > 32) throw new Error("createBitapKey: key length must be less than 32.");
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

export function bitapSearch(key: BitapKey, maxErrors: number, text: string, pos = 0): [number, number] | null {
    const state = Array(maxErrors + 1).fill(0);
    const matchbit = 1 << (key.length - 1);

    for (let i = pos; i < text.length; i++) {
        const mask = key.mask.get(text[i]) || 0;
        let replace = 0;
        let insertion = 0;
        let deletion = 0;

        for (let distance = 0; distance < maxErrors + 1; distance++) {
            const next_state_candidate = (state[distance] << 1) | 1;
            const next_state = (next_state_candidate & mask) | replace | insertion | deletion;

            replace = next_state_candidate;
            insertion = state[distance];
            deletion = next_state;

            state[distance] = next_state;

            if ((state[distance] & matchbit) !== 0) {
                return [i - key.length + 1, distance];
            }
        }
    }

    return null;
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

export function generate1ToNgram(n: number, text: string): string[] {
    return [...Array(n).keys()].flatMap((x) => generateNgramInternal(x + 1, text));
}

export function generateNgram(n: number, text: string): string[] {
    return text.length < n ? [text] : generateNgramInternal(n, text);
}

export function generateNgramToTail(n: number, text: string): string[] {
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

function generateNgramInternal(n: number, text: string): string[] {
    if (text.length === 0) throw new Error("call generateNgram with null string.");
    if (text.length < n) {
        return [];
    }

    const grams: string[] = [];
    for (let i = 0; i <= text.length - n; i++) {
        grams.push(text.slice(i, i + n));
    }
    return grams;
}
