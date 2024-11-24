import { compose } from "@src/util";

// 全角文字 → 半角文字
const fullWidthToHalfWidth = (input: string) =>
    input.replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
         .replace(/\u3000/g, ' '); // 全角スペース → 半角スペース

// Unicode正規化 (濁点・半濁点の分離)
const normalizeUnicode = (input: string) =>
    input.normalize('NFKC');


// 半角カタカナ → 全角カタカナ変換
const halfWidthKanaToFullWidthKana = (input: string) =>
    input.replace(/[\uFF65-\uFF9F]/g, c => {
      const map: { [key: string]: string } = {
        '｡': '。', '､': '、', '･': '・', 'ｦ': 'ヲ',
        'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
        'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
        'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
        'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
        'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
        'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
        'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
        'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
        'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ', 'ｰ': 'ー',
        'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ', 'ﾗ': 'ラ', 'ﾘ': 'リ',
        'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ', 'ﾜ': 'ワ', 'ﾝ': 'ン',
        'ﾞ': '゛', 'ﾟ': '゜'
      };
      return map[c] || c;
    });

// アルファベットの大文字化
const toUpperCase = (input: string) => 
    input.toLocaleUpperCase("en-US");


export const normalizeText = (text: string) =>
    compose(
        fullWidthToHalfWidth,
        normalizeUnicode,
        halfWidthKanaToFullWidthKana,
        toUpperCase
    )(text);

function splitByDelimiter(text: string[]): string[] {
    const separators = /[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007F\u0080-\u00BF\u02B0-\u02FF\u2000-\u206F\u3000-\u3004\u3007-\u303F\uFF00-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFE0-\uFFFF]/;
    return text.flatMap(t => t.split(separators).filter(Boolean));
}

function splitByNonSpaceSeparatedChar(text: string[]): string[] {
    const nonSpaceSeparatedCharRegex = /[\u2E80-\u31FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u0E00-\u17FF\u1A00-\u1B7F\uA980-\uAA5F\u0D80-\u0DFF\u{20000}-\u{2CEAF}]+|[^\u2E80-\u31FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u0E00-\u17FF\u1A00-\u1B7F\uA980-\uAA5F\u0D80-\u0DFF\u{20000}-\u{2CEAF}]+/gu;
    const matches = text.flatMap(t => t.match(nonSpaceSeparatedCharRegex)).filter(x => x !== null);

    return matches;
}

export const tokenizeTexts = (text: string[]) =>
    compose(
        splitByDelimiter,
        splitByNonSpaceSeparatedChar,
    )(text);

export function docToWords(doc: string[]) : string[] {
    const normalized = doc.map(normalizeText);
    const tokenized  = tokenizeTexts(normalized);

    return tokenized;
}
