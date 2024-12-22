import { pipe } from "@src/algorithm";

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
    [0x2E80, 0x31FF],   // CJK Radicals, Kangxi Radicals, etc.
    [0x3400, 0x9FFF],   // CJK Unified Ideographs Extension A, CJK Unified Ideographs
    [0xF900, 0xFAFF],   // CJK Compatibility Ideographs
    [0x20000, 0x2CEAF], // CJK Unified Ideographs Extension B-H
    
    // Korean
    [0xAC00, 0xD7AF],   // Hangul Syllables
    [0x1100, 0x11FF],   // Hangul Jamo
    [0x3130, 0x318F],   // Hangul Compatibility Jamo
    
    // Southeast Asian Scripts
    [0x0E00, 0x0E7F],   // Thai
    [0x0E80, 0x0EFF],   // Lao
    [0x1000, 0x109F],   // Myanmar
    [0x1780, 0x17FF],   // Khmer
    [0x1A00, 0x1A1F],   // Buginese
    [0x1B00, 0x1B7F],   // Balinese
    [0xA980, 0xA9DF],   // Javanese
    
    // South Asian Scripts
    [0x0D80, 0x0DFF],   // Sinhala
    [0x0980, 0x09FF],   // Bengali
    [0x0900, 0x097F],   // Devanagari
    [0x0A80, 0x0AFF],   // Gujarati
    [0x0C80, 0x0CFF],   // Kannada
    [0x0B00, 0x0B7F],   // Oriya
    [0x0D00, 0x0D7F],   // Malayalam
];

export function isNonSpaceSeparatedChar(char: string): boolean {
    const codePoint = Array.from(char)[0].codePointAt(0)!;
    
    return nonSpaceSeparatedRanges.some(([start, end]) => 
        codePoint >= start && codePoint <= end
    );
}

export function splitByNonSpaceSeparatedChar(text: string[]): string[] {
    const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });
    const result: string[] = [];
    
    for (const t of text) {
        let currentGroup = '';
        let isCurrentNonSpaceSeparated: boolean | null = null;

        // Iterate through grapheme clusters
        for (const { segment } of segmenter.segment(t)) {
            const isNonSpaceSeparated = isNonSpaceSeparatedChar(segment);

            // Start a new group if the separation type changes
            if (isCurrentNonSpaceSeparated !== null && isCurrentNonSpaceSeparated !== isNonSpaceSeparated) {
                if (currentGroup) {
                    result.push(currentGroup);
                }
                currentGroup = '';
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

export const defaultNormalizer = pipe(normalizeJapanese, normalizeUnicode, toLowerCase);
export const defaultSpritter = pipe(splitByDelimiter, splitByNonSpaceSeparatedChar);
