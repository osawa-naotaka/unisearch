import { expect, test } from 'vitest';
import { extractStrings, getValueByPath, traverseIn, traverseSelected } from '@src/traverser';

test('getValueByPath No.1', () => 
    expect(getValueByPath("string1", "")). toStrictEqual("string1"));

test('getValueByPath No.2', () => 
    expect(getValueByPath({key1: "string1"}, "key1")). toStrictEqual("string1"));

test('getValueByPath No.3', () => 
    expect(getValueByPath({key1: {key3: ["string2", "string3"]}, key2: "string1" }, "key1")). toStrictEqual({key3: ["string2", "string3"]}));

test('getValueByPath No.4', () => 
    expect(getValueByPath({key1: {key3: ["string2", "string3"]}, key2: "string1" }, "key1.key3")). toStrictEqual(["string2", "string3"]));


test('traverse object No.1', () =>
    expect([...traverseIn("string1")]).toStrictEqual([["", "string1"]]));

test('traverse object No.2', () =>
    expect([...traverseIn({key1: "string1", key2: "string2"})]).toStrictEqual([["key1", "string1"], ["key2", "string2"]]));

test('traverse object No.3', () =>
    expect([...traverseIn(["string1", "string2"])]).toStrictEqual([["0", "string1"], ["1", "string2"]]));

test('traverse object No.4', () =>
    expect([...traverseIn({field1: ["string1", "string2"], field2: {field3: "string3", field4: 10}})])
    .toStrictEqual([["field1.0", "string1"], ["field1.1", "string2"], ["field2.field3", "string3"]]));

test('traverse object No.5', () =>
    expect([...traverseSelected("string1", [""])]).toStrictEqual([["", "string1"]]));

test('traverse object No.6', () =>
    expect([...traverseSelected({key1: "string1", key2: "string2"}, ["key1"])]).toStrictEqual([["key1", "string1"]]));

test('traverse object No.7', () =>
    expect([...traverseSelected({key1: "string1", key2: "string2"}, ["key2"])]).toStrictEqual([["key2", "string2"]]));

test('traverse object No.8', () =>
    expect([...traverseSelected({field1: ["string1", "string2"], field2: {field3: "string3", field4: 10}}, ["field1", "field2"])])
    .toStrictEqual([["field1.0", "string1"], ["field1.1", "string2"], ["field2.field3", "string3"]]));
    
test('traverse object No.9', () =>
    expect([...traverseSelected({field1: ["string1", "string2"], field2: {field3: "string3", field4: 10}}, ["field2"])])
    .toStrictEqual([["field2.field3", "string3"]]));

test('traverse object No.10', () =>
    expect(() => [...traverseSelected({field1: ["string1", "string2"], field2: {field3: "string3", field4: 10}}, ["field3"])])
    .toThrowError(/^unisearch: cannot find path/));


    test('extract string No.1', () =>
        expect(extractStrings("", "string1")).toStrictEqual([["", "string1"]]));
    
    test('extract string No.2', () =>
        expect(extractStrings("", {key1: "string1", key2: "string2"})).toStrictEqual([["key1", "string1"], ["key2", "string2"]]));
    
    test('extract string No.3', () =>
        expect(extractStrings("", ["string1", "string2"])).toStrictEqual([["", "string1 string2"]]));
    
    test('extract string No.4', () =>
        expect(extractStrings("", {field1: ["string1", "string2"], field2: {field3: "string3", field4: 10}}))
        .toStrictEqual([["field1", "string1 string2"], ["field2.field3", "string3"]]));
    
