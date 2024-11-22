export function forceQuerySelector<T extends HTMLElement>(selector: string, parent?: HTMLElement): T {
    const elem = parent ? parent.querySelector<T>(selector) : document.querySelector<T>(selector);
    if (elem) {
        return elem;
    }
    throw new Error(`cannot find selector ${selector}`);
}

export function compose<T>(...fns: ((arg: T) => T)[]) : (arg: T) => T {
    return (arg: T) =>
        fns.reduce((val, f) => f(val), arg);
}

export function intersect<T>(a: T[], b: T[]) : T[] {
    const result = [];
    for(const x of a) {
        if(b.includes(x)) {
            result.push(x);
        }
    }
    return result;
}

const encoder = new TextEncoder();
export function toUtf8(text: string) {
    return encoder.encode(text);
}

export class MSet<T> extends Set<T> {
    constructor(init?: T[]) {
        super(init);
    }
    map<R>(fn: (value: T, index:number, array: T[]) => R) : R[] {
        return Array.from(this).map(fn);
    }
    flatMap<R>(fn: (value: T, index:number, array: T[]) => R[]) : R[] {
        return Array.from(this).flatMap(fn);
    }
}

export function addLikeSet<T>(item: T, array?: T[]) : T[] {
    return array ? Array.from(new Set([...array, item])) : [item];
}




type UnicodeRange = [number, number];

/**
 * 結合された空白で単語が区切られない言語のUnicode範囲
 */
const nonSpaceSeparatedRanges: UnicodeRange[] = [
  // CJK関連ブロックと接続可能な範囲
  [0x2E80, 0x31FF], // CJK Radicals Supplement ～ CJK Symbols and Punctuation, Hiragana, Katakana, Katakana Extensions
  [0x3400, 0x9FFF], // CJK Unified Ideographs Extension A, CJK Unified Ideographs
  [0xAC00, 0xD7AF], // Hangul Syllables
  [0xF900, 0xFAFF], // CJK Compatibility Ideographs
  [0x20000, 0x2CEAF], // CJK Unified Ideographs Extensions B～E

  // Southeast AsianとSouth Asianブロック
  [0x0E00, 0x17FF], // Thai, Lao, Tibetan, Myanmar, Khmer
  [0x1A00, 0x1B7F], // Tai Tham, Balinese, Lontara
  [0xA980, 0xAA5F], // Javanese, Cham

  // South Asianとその他のブロック (少量の空白を結合)
  [0x0D80, 0x0DFF], // Sinhala
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
export function calculateJsonSize(record: Object): number {
    // RecordをJSON文字列化
    const jsonString = JSON.stringify(record);
    if (jsonString === undefined) {
        throw new Error("Failed to convert record to JSON string");
    }
    // 文字列をバイト単位で計算
    return new Blob([jsonString]).size;
}
