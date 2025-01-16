import { describe, expect, test } from 'vitest';
import { UniSearchError } from "@src/frontend/base";
import { createIndex } from "@src/frontend/indexing";
import { LinearIndex } from "@src/method/linearindex";
import { search } from "@src/frontend/search";

describe("search test", async () => {
    const contents = [
        { title: "タイトル１", text: "テキスト１．１テキスト１．２テキスト１．３"},
        { title: "タイトル２", text: "テキスト２．１テキスト２．２テキスト２．３"},
        { title: "タイトル３", text: "テキスト３．１テキスト３．２テキスト３．３"},
    ];

    const index = createIndex(LinearIndex, contents, { key_field: "title" });
    if(index instanceof UniSearchError) {
        throw index;
    }

    test("exact search 1", async () =>
        expect(await search(index, '"タイトル2"'))
        .toStrictEqual([
            {
                id: 1,
                key: "タイトル２",
                score: 1.4054651081081644,
                refs: [
                    {
                        token: "タイトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        distance: 0,
                    }
                ]
            }
        ])
    );

    test("exact search 2", async () =>
        expect(await search(index, '"テキスト3"'))
        .toStrictEqual([
            {
                id: 2,
                key: "タイトル３",
                score: 1.0039036486486888,
                refs: [
                    {
                        token: "テキスト3",
                        path: "text",
                        pos: 0,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                    {
                        token: "テキスト3",
                        path: "text",
                        pos: 7,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                    {
                        token: "テキスト3",
                        path: "text",
                        pos: 14,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                ]
            }
        ])
    );

    test("fuzzy search 1", async () =>
        expect(await search(index, 'タエトル2'))
        .toStrictEqual([
            {
                id: 1,
                key: "タイトル２",
                score: 0.7027325540540822,
                refs: [
                    {
                        token: "タエトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        distance: 1,
                    }
                ]
            }
        ])
    );

    test("from: search 1", async () =>
        expect(await search(index, 'from:title タイトル2'))
        .toStrictEqual([
            {
                id: 1,
                key: "タイトル２",
                score: 1.4054651081081644,
                refs: [
                    {
                        token: "タイトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        distance: 0,
                    }
                ]
            }
        ])
    );

    test("weight: search 1", async () =>
        expect(await search(index, 'weight:2 "タイトル2"'))
        .toStrictEqual([
            {
                id: 1,
                key: "タイトル２",
                score: 1.4054651081081644 * 2,
                refs: [
                    {
                        token: "タイトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        distance: 0,
                    }
                ]
            }
        ])
    );

    test("distance: search 1", async () =>
        expect(await search(index, 'from:title distance:4 エエエエ2'))
        .toStrictEqual([
            {
                id: 1,
                key: "タイトル２",
                score: 0.2810930216216329,
                refs: [
                    {
                        token: "エエエエ2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        distance: 4,
                    }
                ]
            }
        ])
    );

    test("AND search 1", async () =>
        expect(await search(index, '"タイトル3" "テキスト3.1"'))
        .toStrictEqual([
            {
                id: 2,
                key: "タイトル３",
                score: 1.8739534774775524,
                refs: [
                    {
                        token: "タイトル3",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル3",
                        distance: 0,
                    },
                    {
                        token: "テキスト3.1",
                        path: "text",
                        pos: 0,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                ]
            }
        ])
    );

    test("OR search 1", async () =>
        expect(await search(index, '"タイトル3" OR "タイトル2"'))
        .toStrictEqual([
            {
                id: 2,
                key: "タイトル３",
                score: 1.4054651081081644,
                refs: [
                    {
                        token: "タイトル3",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル3",
                        distance: 0,
                    },
                ]
            },
            {
                id: 1,
                key: "タイトル２",
                score: 1.4054651081081644,
                refs: [
                    {
                        token: "タイトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        distance: 0,
                    },
                ]
            }
        ])
    );

    test("NOT search 1", async () =>
        expect(await search(index, '"テキスト" -"タイトル１" -"タイトル２"'))
        .toStrictEqual([
            {
                id: 2,
                key: "タイトル３",
                score: 0.4070388157418395,
                refs: [
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 0,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 7,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 14,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                ]
            },
        ])
    );

    test("NOT search 2", async () =>
        expect(await search(index, '-"タイトル１" -"タイトル２" "テキスト"'))
        .toStrictEqual([
            {
                id: 2,
                key: "タイトル３",
                score: 0.4070388157418395,
                refs: [
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 0,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 7,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 14,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        distance: 0,
                    },
                ]
            },
        ])
    );
});
