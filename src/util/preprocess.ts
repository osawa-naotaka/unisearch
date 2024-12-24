import { UniSearchError } from "@src/frontend/base";
import { pipe } from "@src/util/algorithm";

export const normalizeJapanese = (input: string) =>
    input
        .replace(/[\uFF66-\uFF9D]/gu, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60)) // 半角カナ → 全角カナ
        .replace(/[\uFF01-\uFF5E]/gu, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // 全角文字 → 半角文字
        .replace(/\uFF9E/gu, "゛") // 半角濁点 → 全角濁点
        .replace(/\uFF9F/gu, "゜") // 半角半濁点 → 全角半濁点
        .replace(/[ー]/gu, "ー") // 既存の長音符の正規化
        .replace(/\u3000/gu, " "); // 全角スペース → 半角スペース

export const normalizeUnicode = (input: string) => input.normalize("NFKC");

export const toLowerCase = (input: string) => input.toLocaleLowerCase("en-US");

export function splitBySpace(text: string[]): string[] {
    const separators =
        // biome-ignore lint: ignore control charactor \u000D
        /[\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u0009\u000A\u000B\u000C\u000D\u0085\u2028\u2029\u200B]/u;
    return text.flatMap((t) => t.split(separators).filter(Boolean));
}

export function splitByDelimiter(text: string[]): string[] {
    const separators =
        // biome-ignore lint: ignore control charactor \u0000 ?
        /[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007F\u0080-\u00BF\u02B0-\u02FF\u2000-\u206F\u3000-\u3004\u3007-\u303F\u30fb\uFF00-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFE0-\uFFFF]/u;
    return text.flatMap((t) => t.split(separators).filter(Boolean));
}

// Unicode ranges for non-space-separated scripts
const nonSpaceSeparatedRanges = [
    // CJK Scripts
    [0x2e80, 0x31ff], // CJK Radicals, Kangxi Radicals, etc.
    [0x3400, 0x9fff], // CJK Unified Ideographs Extension A, CJK Unified Ideographs
    [0xf900, 0xfaff], // CJK Compatibility Ideographs
    [0x20000, 0x2ceaf], // CJK Unified Ideographs Extension B-H

    // Korean
    [0xac00, 0xd7af], // Hangul Syllables
    [0x1100, 0x11ff], // Hangul Jamo
    [0x3130, 0x318f], // Hangul Compatibility Jamo

    // Southeast Asian Scripts
    [0x0e00, 0x0e7f], // Thai
    [0x0e80, 0x0eff], // Lao
    [0x1000, 0x109f], // Myanmar
    [0x1780, 0x17ff], // Khmer
    [0x1a00, 0x1a1f], // Buginese
    [0x1b00, 0x1b7f], // Balinese
    [0xa980, 0xa9df], // Javanese

    // South Asian Scripts
    [0x0d80, 0x0dff], // Sinhala
    [0x0980, 0x09ff], // Bengali
    [0x0900, 0x097f], // Devanagari
    [0x0a80, 0x0aff], // Gujarati
    [0x0c80, 0x0cff], // Kannada
    [0x0b00, 0x0b7f], // Oriya
    [0x0d00, 0x0d7f], // Malayalam
];

export function isNonSpaceSeparatedChar(char: string): boolean {
    if (char.length === 0) throw new UniSearchError("unisearch: internal error on isNonSpaceSeparatedChar 1.");
    const codePoint = Array.from(char)[0].codePointAt(0);
    if (codePoint === undefined) throw new UniSearchError("unisearch: internal error on isNonSpaceSeparatedChar 2.");

    return nonSpaceSeparatedRanges.some(([start, end]) => codePoint >= start && codePoint <= end);
}

export function splitByNonSpaceSeparatedChar(text: string[]): string[] {
    const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
    const result: string[] = [];

    for (const t of text) {
        let currentGroup = "";
        let isCurrentNonSpaceSeparated: boolean | null = null;

        // Iterate through grapheme clusters
        for (const { segment } of segmenter.segment(t)) {
            const isNonSpaceSeparated = isNonSpaceSeparatedChar(segment);

            // Start a new group if the separation type changes
            if (isCurrentNonSpaceSeparated !== null && isCurrentNonSpaceSeparated !== isNonSpaceSeparated) {
                if (currentGroup) {
                    result.push(currentGroup);
                }
                currentGroup = "";
            }

            currentGroup += segment;
            isCurrentNonSpaceSeparated = isNonSpaceSeparated;
        }

        // Push the last group
        if (currentGroup) {
            result.push(currentGroup);
        }
    }

    return result;
}

export function splitByKatakana(text: string[]): string[] {
    const regex = /[\u30A0-\u30FF]+|[^ \u30A0-\u30FF]+/g;
    const matches = text.flatMap((t) => t.match(regex)).filter((x) => x !== null);
    return matches;
}

export function splitByGrapheme(str: string): string[] {
    const r = [];
    const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
    for (const { segment } of segmenter.segment(str)) {
        r.push(segment);
    }
    return r;
}

export const defaultNormalizer = pipe(normalizeJapanese, normalizeUnicode, toLowerCase);
export const hybridSpritter = pipe(splitByDelimiter, splitByNonSpaceSeparatedChar);
