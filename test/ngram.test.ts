import { expect, test } from 'vitest';
import { generateNgram } from '@src/ngram';

test('1-gram for "", false, is []', () =>
    expect(generateNgram(1, false, "")).toStrictEqual([]));

test('1-gram for "t", false, is ["t"]', () =>
    expect(generateNgram(1, false, "t")).toStrictEqual(["t"]));

test('1-gram for "test", false, is ["t", "e", "s", "t"]', () =>
    expect(generateNgram(1, false, "test")).toStrictEqual(["t", "e", "s", "t"]));

test('1-gram for "", true, is []', () =>
    expect(generateNgram(1, false, "")).toStrictEqual([]));

test('1-gram for "t", true, is ["t"]', () =>
    expect(generateNgram(1, true, "t")).toStrictEqual(["t"]));

test('1-gram for "test", true, is ["t", "e", "s", "t"]', () =>
    expect(generateNgram(1, false, "test")).toStrictEqual(["t", "e", "s", "t"]));


test('2-gram for "", false, is []', () =>
    expect(generateNgram(2, false, "")).toStrictEqual([]));

test('2-gram for "t", false, is ["t"]', () =>
    expect(generateNgram(2, false, "t")).toStrictEqual(["t"]));

test('2-gram for "te", false, is ["te"]', () =>
    expect(generateNgram(2, false, "te")).toStrictEqual(["te"]));

test('2-gram for "test", false, is ["te", "es", "st"]', () =>
    expect(generateNgram(2, false, "test")).toStrictEqual(["te", "es", "st"]));

test('2-gram for "", true, is []', () =>
    expect(generateNgram(2, true, "")).toStrictEqual([]));

test('2-gram for "t", ture, is ["t"]', () =>
    expect(generateNgram(2, true, "t")).toStrictEqual(["t"]));

test('2-gram for "te", true, is ["t", "te"]', () =>
    expect(generateNgram(2, true, "te")).toStrictEqual(["t", "te"]));

test('2-gram for "test", true, is ["t", "te", "es", "st"]', () =>
    expect(generateNgram(2, true, "test")).toStrictEqual(["t", "te", "es", "st"]));



test('3-gram for "", false, is []', () =>
    expect(generateNgram(3, false, "")).toStrictEqual([]));

test('3-gram for "t", false, is ["t"]', () =>
    expect(generateNgram(3, false, "t")).toStrictEqual(["t"]));

test('3-gram for "te", false, is ["te"]', () =>
    expect(generateNgram(3, false, "te")).toStrictEqual(["te"]));

test('3-gram for "tes", false, is ["tes"]', () =>
    expect(generateNgram(3, false, "tes")).toStrictEqual(["tes"]));

test('3-gram for "test", false, is ["tes", "est"]', () =>
    expect(generateNgram(3, false, "test")).toStrictEqual(["tes", "est"]));



test('3-gram for "", false, is []', () =>
    expect(generateNgram(3, true, "")).toStrictEqual([]));

test('3-gram for "t", false, is ["t"]', () =>
    expect(generateNgram(3, true, "t")).toStrictEqual(["t"]));

test('3-gram for "te", false, is ["t", "te"]', () =>
    expect(generateNgram(3, true, "te")).toStrictEqual(["t", "te"]));

test('3-gram for "tes", false, is ["t", "te", "tes"]', () =>
    expect(generateNgram(3, true, "tes")).toStrictEqual(["t", "te", "tes"]));

test('3-gram for "test", false, is ["t", "te", "tes", "est"]', () =>
    expect(generateNgram(3, true, "test")).toStrictEqual(["t", "te", "tes", "est"]));
