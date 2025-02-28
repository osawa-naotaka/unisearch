import { describe, expect, test } from 'vitest';
import { StaticSeekError } from "@src/frontend/base";
import { createIndex } from "@src/frontend/indexing";
import { LinearIndex } from "@src/method/linearindex";
import { search } from "@src/frontend/search";

describe("search test", async () => {
    const contents = [
        { title: "タイトル１", text: "テキスト１．１テキスト１．２テキスト１．３"},
        { title: "タイトル２", text: "テキスト２．１テキスト２．２テキスト２．３"},
        { title: "タイトル３", text: "テキスト３．１テキスト３．２テキスト３．３"},
    ];

    const index = createIndex(LinearIndex, contents, { key_fields: ["title"]  });
    if(index instanceof StaticSeekError) {
        throw index;
    }

    test("exact search 1", async () =>
        expect(await search(index, '"タイトル2"'))
        .toStrictEqual([
            {
                id: 1,
                key: { title: "タイトル２" },
                score: 1.4054651081081644,
                refs: [
                    {
                        token: "タイトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        keyword_range: [0, 5],
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
                key: { title: "タイトル３" },
                score: 1.0039036486486888,
                refs: [
                    {
                        token: "テキスト3",
                        path: "text",
                        pos: 0,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [0, 5],
                        distance: 0,
                    },
                    {
                        token: "テキスト3",
                        path: "text",
                        pos: 7,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [7, 12],
                        distance: 0,
                    },
                    {
                        token: "テキスト3",
                        path: "text",
                        pos: 14,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [14, 19],
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
                key: { title: "タイトル２" },
                score: 0.7027325540540822,
                refs: [
                    {
                        token: "タエトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        keyword_range: [0, 5],
                        distance: 1,
                    }
                ]
            }
        ])
    );

    test("from: search 1", async () =>
        expect(await search(index, 'from:title "2"'))
        .toStrictEqual([
            {
                id: 1,
                key: { title: "タイトル２" },
                score: 0.2810930216216329,
                refs: [
                    {
                        token: "2",
                        path: "title",
                        pos: 4,
                        wordaround: "タイトル2",
                        keyword_range: [4, 5],
                        distance: 0,
                    }
                ]
            },
        ])
    );

    test("distance: search 1", async () =>
        expect(await search(index, 'from:title distance:3 エエエル2'))
        .toStrictEqual([
            {
                id: 1,
                key: { title: "タイトル２" },
                score: 0.3513662770270411,
                refs: [
                    {
                        token: "エエエル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        keyword_range: [0, 5],
                        distance: 3,
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
                key: { title: "タイトル３" },
                score: 1.8739534774775524,
                refs: [
                    {
                        token: "タイトル3",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル3",
                        keyword_range: [0, 5],
                        distance: 0,
                    },
                    {
                        token: "テキスト3.1",
                        path: "text",
                        pos: 0,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [0, 7],
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
                key: { title: "タイトル３" },
                score: 1.4054651081081644,
                refs: [
                    {
                        token: "タイトル3",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル3",
                        keyword_range: [0, 5],
                        distance: 0,
                    },
                ]
            },
            {
                id: 1,
                key: { title: "タイトル２" },
                score: 1.4054651081081644,
                refs: [
                    {
                        token: "タイトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        keyword_range: [0, 5],
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
                key: { title: "タイトル３" },
                score: 0.4070388157418395,
                refs: [
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 0,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [0, 4],
                        distance: 0,
                    },
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 7,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [7, 11],
                        distance: 0,
                    },
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 14,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [14, 18],
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
                key: { title: "タイトル３" },
                score: 0.4070388157418395,
                refs: [
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 0,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [0, 4],
                        distance: 0,
                    },
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 7,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [7, 11],
                        distance: 0,
                    },
                    {
                        token: "テキスト",
                        path: "text",
                        pos: 14,
                        wordaround: "テキスト3.1テキスト3.2テキスト3.3",
                        keyword_range: [14, 18],
                        distance: 0,
                    },
                ]
            },
        ])
    );
});

describe("search test 2", async () => {
    const contents = [
        { title: "タイトル１", text: "テキスト１．１テキスト１．２テキスト１．３"},
        { title: "タイトル２", text: "テキスト２．１テキスト２．２テキスト２．３"},
        { title: "タイトル３", text: "テキスト３．１テキスト３．２テキスト３．３"},
    ];

    const index = createIndex(LinearIndex, contents, { key_fields: ["title"], weights: [["title", 2]] });
    if(index instanceof StaticSeekError) {
        throw index;
    }

    test("weight: search 1", async () =>
        expect(await search(index, '"タイトル2"'))
        .toStrictEqual([
            {
                id: 1,
                key: { title: "タイトル２" },
                score: 1.4054651081081644 * 2,
                refs: [
                    {
                        token: "タイトル2",
                        path: "title",
                        pos: 0,
                        wordaround: "タイトル2",
                        keyword_range: [0, 5],
                        distance: 0,
                    }
                ]
            }
        ])
    );
});
