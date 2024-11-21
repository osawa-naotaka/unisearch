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
    input.toUpperCase();


export const normalizeText = (text: string) =>
    compose(
        fullWidthToHalfWidth,
        normalizeUnicode,
        halfWidthKanaToFullWidthKana,
        toUpperCase
    )(text);

// カタカナで文字列を分割
function splitByKatakana(text: string[]): string[] {
    // カタカナ（全角）の範囲: \u30A0-\u30FF
    const regex = /[\u30A0-\u30FF]+|[^ \u30A0-\u30FF]+/g;

    // matchがnullを返した場合は削除する
    const matches = text.flatMap(t => t.match(regex)).filter(x => x !== null);

    return matches;
}

function splitByDelimiter(text: string[]): string[] {
    const separators = /[ \n\t\r,.;:?!(){}[\]<>「」『』`'’"“”\-—–‒‐/\\+=*%&|$#@^_~～｡､･。、「」・]/;
    return text.flatMap(t => t.split(separators).filter(Boolean));
}

function splitByHalfAndFullWidth(text: string[]): string[] {
    // 半角文字の正規表現: ASCII範囲、半角カタカナなど
    const halfWidthRegex = /[\u0020-\u007E\uFF61-\uFFDC\uFFE8-\uFFEE]+|[^ \u0020-\u007E\uFF61-\uFFDC\uFFE8-\uFFEE]+/g;

    // matchがnullを返した場合は削除する
    const matches = text.flatMap(t => t.match(halfWidthRegex)).filter(x => x !== null);

    return matches;    
}

export const tokenizeTexts = (text: string[]) =>
    compose(
        splitByKatakana,
        splitByHalfAndFullWidth,
        splitByDelimiter
    )(text);
