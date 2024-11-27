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
