export function rangeArray(n: number): number[] {
    return [...Array(n).keys()];
}

export function compareString(a: string, b: string) {
    return a > b ? 1 : a < b ? -1 : 0;
}

const encoder = new TextEncoder();
export function toUtf8(text: string) {
    return encoder.encode(text);
}

export class MSet<T> extends Set<T> {
    map<R>(fn: (value: T, index: number, array: T[]) => R): R[] {
        return Array.from(this).map(fn);
    }
    flatMap<R>(fn: (value: T, index: number, array: T[]) => R[]): R[] {
        return Array.from(this).flatMap(fn);
    }
}

export function firstLetter(s: string) {
    return Array.from(s)[0];
}

export function restString(s: string): string {
    const unicode_str = Array.from(s);
    unicode_str.shift();
    return unicode_str.join("");
}

type UnicodeRange = [number, number];

/**
 * 結合された空白で単語が区切られない言語のUnicode範囲
 */
const nonSpaceSeparatedRanges: UnicodeRange[] = [
    // CJK関連ブロックと接続可能な範囲
    [0x2e80, 0x31ff], // CJK Radicals Supplement ～ CJK Symbols and Punctuation, Hiragana, Katakana, Katakana Extensions
    [0x3400, 0x9fff], // CJK Unified Ideographs Extension A, CJK Unified Ideographs
    [0xac00, 0xd7af], // Hangul Syllables
    [0xf900, 0xfaff], // CJK Compatibility Ideographs
    [0x20000, 0x2ceaf], // CJK Unified Ideographs Extensions B～E

    // Southeast AsianとSouth Asianブロック
    [0x0e00, 0x17ff], // Thai, Lao, Tibetan, Myanmar, Khmer
    [0x1a00, 0x1b7f], // Tai Tham, Balinese, Lontara
    [0xa980, 0xaa5f], // Javanese, Cham

    // South Asianとその他のブロック (少量の空白を結合)
    [0x0d80, 0x0dff], // Sinhala
];

// @ts-ignore
const delimiter: UnicodeRange[] = [
    [0x0000, 0x002f], // 制御文字・約物・記号
    [0x003a, 0x0040], // 約物・記号
    [0x005b, 0x0060], // 約物・記号
    [0x007b, 0x007f], // 制御文字・約物・記号
    [0x0080, 0x00bf], // 制御文字・句読点・記号
    [0x02b0, 0x02ff], // 前進を伴う修飾文字

    [0x2000, 0x206f], // 一般句読点

    [0x3000, 0x3004], // CJKの記号及び句読点
    [0x3007, 0x303f], // CJKの記号及び句読点
    [0x30fb, 0x30fb], // ・

    [0xff00, 0xff0f], // 半角・全角形
    [0xff1a, 0xff20],
    [0xff3b, 0xff40],
    [0xff5b, 0xff65],
    [0xffe0, 0xffff],
];

/**
 * 指定した文字が空白で単語が区切られない言語の範囲に属するか確認する
 * @param char 判定対象の文字
 * @returns boolean (true: 属している, false: 属していない)
 */
export function isNonSpaceSeparatedChar(char: string): boolean {
    if (char.length !== 1) {
        throw new Error("Input must be a single character.");
    }

    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) {
        return false;
    }

    return nonSpaceSeparatedRanges.some(([start, end]) => codePoint >= start && codePoint <= end);
}

/**
 * JSON文字列のサイズをバイト単位で計算する関数
 * @param record - サイズを計算したいRecord
 * @returns バイトサイズ
 */
export function calculateJsonSize<T>(obj: T): number {
    const jstr = JSON.stringify(obj);
    if (jstr === undefined) {
        throw new Error("Failed to convert record to JSON string");
    }
    return new Blob([jstr]).size;
}

export async function calculateGzipedJsonSize<T>(obj: T): Promise<number> {
    const jstr = JSON.stringify(obj);
    if (jstr === undefined) {
        throw new Error("Failed to convert record to JSON string");
    }
    const cstrm = new Blob([jstr]).stream().pipeThrough(new CompressionStream("gzip"));
    return (await new Response(cstrm).arrayBuffer()).byteLength;
}
