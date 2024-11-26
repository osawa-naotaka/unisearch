
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

export function union<T>(a: T[], b?: T[]) : T[] {
    return b ? Array.from(new Set([...a, ...b])) : a;
}

export function difference<T>(a: T[], b: T[]): T[] {
    return a.filter(e => !b.includes(e));
}

export function appendIfNotExists<T>(item: T, array?: T[]) : T[] {
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
    const minLength = Math.min(a.length, b.length);
    const result: R[] = [];
    
    for (let i = 0; i < minLength; i++) {
      result.push(combine(a[i], b[i], c[i]));
    }
    
    return result;
}

export function foldl1<T>(array: T[], fn: (acc: T, cur: T) => T): T {
    if (array.length === 0) {
        throw new Error("foldl1 cannot be called on an empty array.");
    }

    let acc = array[0];
    for (let i = 1; i < array.length; i++) {
        acc = fn(acc, array[i]);
    }

    return acc;
}

export function accumulateArray<T>(array: T[][], fn: (acc: T[], cur: T[]) => T[]) : T[] {
    if(array.length == 0) {
        return [];
    } else if(array.length == 1) {
        return array[0];
    } else {
        return foldl1(array, fn);
    }
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

// @ts-ignore
const delimiter: UnicodeRange[] = [
    [0x0000, 0x002F],  // 制御文字・約物・記号
    [0x003A, 0x0040],  // 約物・記号
    [0x005B, 0x0060],  // 約物・記号
    [0x007B, 0x007F],  // 制御文字・約物・記号
    [0x0080, 0x00BF],  // 制御文字・句読点・記号
    [0x02B0, 0x02FF],  // 前進を伴う修飾文字
  
    [0x2000, 0x206F],  // 一般句読点
  
    [0x3000, 0x3004],  // CJKの記号及び句読点
    [0x3007, 0x303F],  // CJKの記号及び句読点
  
    [0xFF00, 0xFF0F],  // 半角・全角形 
    [0xFF1A, 0xFF20],
    [0xFF3B, 0xFF40],
    [0xFF5B, 0xFF65],
    [0xFFE0, 0xFFFF],
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
