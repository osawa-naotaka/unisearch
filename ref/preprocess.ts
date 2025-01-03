import { compose } from "@ref/algo";
import type { Term } from "@ref/common";

// 日本語正規化
const normalizeJapanese = (input: string) =>
    input
        .replace(/[\uFF66-\uFF9D]/gu, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60)) // 半角カナ → 全角カナ
        .replace(/[\uFF01-\uFF5E]/gu, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // 全角文字 → 半角文字
        .replace(/\uFF9E/gu, "゛") // 半角濁点 → 全角濁点
        .replace(/\uFF9F/gu, "゜") // 半角半濁点 → 全角半濁点
        .replace(/[ー]/gu, "ー") // 既存の長音符の正規化
        .replace(/\u3000/gu, " "); // 全角スペース → 半角スペース

// Unicode正規化 (濁点・半濁点の分離)
const normalizeUnicode = (input: string) => input.normalize("NFKC");

// アルファベットの大文字化
const toUpperCase = (input: string) => input.toLocaleUpperCase("en-US");

export const normalizeText = (text: string) => compose(normalizeJapanese, normalizeUnicode, toUpperCase)(text);

function splitByDelimiter(text: string[]): string[] {
    const separators =
        // biome-ignore lint: bug of biome?
        /[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007F\u0080-\u00BF\u02B0-\u02FF\u2000-\u206F\u3000-\u3004\u3007-\u303F\u30fb\uFF00-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFE0-\uFFFF]/u;
    return text.flatMap((t) => t.split(separators).filter(Boolean));
}

function splitByNonSpaceSeparatedChar(text: string[]): string[] {
    const nonSpaceSeparatedCharRegex =
        /[\u2E80-\u31FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u0E00-\u17FF\u1A00-\u1B7F\uA980-\uAA5F\u0D80-\u0DFF\u{20000}-\u{2CEAF}]+|[^\u2E80-\u31FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u0E00-\u17FF\u1A00-\u1B7F\uA980-\uAA5F\u0D80-\u0DFF\u{20000}-\u{2CEAF}]+/gu;
    const matches = text.flatMap((t) => t.match(nonSpaceSeparatedCharRegex)).filter((x) => x !== null);

    return matches;
}

export function splitByKatakana(text: string[]): string[] {
    const regex = /[\u30A0-\u30FF]+|[^ \u30A0-\u30FF]+/g;
    const matches = text.flatMap((t) => t.match(regex)).filter((x) => x !== null);
    return matches;
}

export const termingTexts = (text: string[]) => compose(splitByDelimiter, splitByNonSpaceSeparatedChar)(text);

export function textToTerm(text: string[]): Term[] {
    return termingTexts(text.map(normalizeText));
}
