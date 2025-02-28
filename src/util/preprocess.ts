import { StaticSeekError } from "@src/frontend/base";
import { pipe } from "@src/util/algorithm";

type CharRange = [number, number][];

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

const spaceRanges: CharRange = [
    [0x0020, 0x0020],
    [0x00a0, 0x00a0],
    [0x1680, 0x1680],
    [0x2000, 0x200a],
    [0x202f, 0x202f],
    [0x205f, 0x205f],
    [0x3000, 0x3000],
    [0x0009, 0x000d],
    [0x0085, 0x0085],
    [0x2028, 0x2029],
    [0x200b, 0x200b],
];

const delimiterRanges: CharRange = [
    [0x0000, 0x002f],
    [0x003a, 0x0040],
    [0x005b, 0x0060],
    [0x007b, 0x007f],
    [0x0080, 0x00bf],
    [0x02b0, 0x02ff],
    [0x2000, 0x206f],
    [0x3000, 0x3004],
    [0x3007, 0x303f],
    [0x30fb, 0x30fb],
    [0xff00, 0xff0f],
    [0xff1a, 0xff20],
    [0xff3b, 0xff40],
    [0xff5b, 0xff65],
    [0xffe0, 0xffff],
];

// Unicode ranges for non-space-separated scripts
const nonSpaceSeparatedRanges: CharRange = [
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

function isRange(range: [number, number][], grapheme: string): boolean {
    const codePoint = grapheme.codePointAt(0);
    if (codePoint === undefined) throw new StaticSeekError("staticseek internal error: isRange.");
    return range.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function splitByRange(range: CharRange, text: string[][]): string[][] {
    const result = [];

    for (const sentence of text) {
        let term = [];
        for (const char of sentence) {
            if (isRange(range, char)) {
                if (term.length !== 0) {
                    result.push(term);
                    term = [];
                }
            } else {
                term.push(char);
            }
        }
        if (term.length !== 0) {
            result.push(term);
        }
    }

    return result;
}

export function isNonSpaceSeparatedChar(grapheme: string): boolean {
    return isRange(nonSpaceSeparatedRanges, grapheme);
}

export function splitBySpace(text: string[][]): string[][] {
    return splitByRange(spaceRanges, text);
}

export function splitBySpaceString(text: string): string[] {
    const separators =
        // biome-ignore lint: ignore control charactor \u000D
        /[\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u0009\u000A\u000B\u000C\u000D\u0085\u2028\u2029\u200B]/u;
    return text.split(separators).filter(Boolean);
}

export function splitByDelimiter(text: string[][]): string[][] {
    return splitByRange(delimiterRanges, text);
}

export function splitByNonSpaceSeparatedChar(text: string[][]): string[][] {
    const result = [];

    for (const t of text) {
        let currentGroup = [];
        let isCurrentNonSpaceSeparated: boolean | null = null;

        // Iterate through grapheme clusters
        for (const grapheme of t) {
            const isNonSpaceSeparated = isNonSpaceSeparatedChar(grapheme);

            // Start a new group if the separation type changes
            if (isCurrentNonSpaceSeparated !== null && isCurrentNonSpaceSeparated !== isNonSpaceSeparated) {
                if (currentGroup.length !== 0) {
                    result.push(currentGroup);
                }
                currentGroup = [];
            }

            currentGroup.push(grapheme);
            isCurrentNonSpaceSeparated = isNonSpaceSeparated;
        }

        // Push the last group
        if (currentGroup) {
            result.push(currentGroup);
        }
    }

    return result;
}

export function splitByGrapheme(str: string): string[] {
    const r = [];
    const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
    for (const { segment } of segmenter.segment(str)) {
        r.push(segment);
    }
    return r;
}

export function excerptOneCodepointPerGraphem(str: string): string {
    let r = "";
    const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
    for (const { segment } of segmenter.segment(str)) {
        r += segment[0];
    }
    return r;
}

export const defaultNormalizer = pipe(normalizeJapanese, normalizeUnicode, toLowerCase);
export const hybridSpritter = pipe(splitByDelimiter, splitByNonSpaceSeparatedChar);
