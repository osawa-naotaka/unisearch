# unisearch.js example (React + Next.js)

This example is deployed on [https://unisearch-react-next.pages.dev/](https://unisearch-react-next.pages.dev/).

## Getting Started

to run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

this example is for static files deployment.

to deploy static files:

```bash
npm install
npm run build
(upload "out" directory to your http server)
```

## How to use unisearch.js with Next.js

### 1. Create index to static file

At first, you need to create index. In this example, src/app/searchindex.json/route.ts is used to create index static file, and /searchindex.json is the path to the index file.

```ts
import { getAllPosts } from "@/lib/posts";
import { GPULinearIndex, UniSearchError, createIndex, indexToObject } from "unisearch.js";

export const dynamic = "force-static";
export const revalidate = false;

export type SearchKey = {
    slug: string;
    data: {
      title: string;
    }
};

export async function GET(request: Request) {
    const allPosts = await getAllPosts();
    const index = createIndex(GPULinearIndex, allPosts, { key_fields: ["data.title", "slug"], search_targets: ["data.title", "content"] });
    if (index instanceof UniSearchError) {
        return new Response(index.message, { status: 500 });
    }
    return Response.json(indexToObject(index));
}
```

dynamic = "force-static" is required to create static file.
In this example, index is created using GPULinearIndex, but you can use other index types.
Variable allPosts is an array of posts, and each post has title, slug and content fields. All of them are indexed by default, but you can specify search_targets to index only specific fields. In this example, title and content are indexed, and slug is not indexed.
When calling createIndex function, key_fields is specified to use title and slug when rendering search results.
After that, index is converted to JSON object by indexToObject function, and returned as Response object.

### 2. Create search page

Next, you need to create search page. src/app/page.tsx is used for this purpose.

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { UniSearchError, createIndexFromObject, search } from "unisearch.js";
import type { SearchResult, UniSearchIndex } from "unisearch.js";
import type { SearchKey } from "@/app/searchindex.json/route.ts";

export default function Index() {
    const INDEX_STATE = {
        NOT_INITIALIZED: 0,
        FETCHING: 1,
        INITIALIZED: 2,
    } as const;
    type INDEX_STATE = (typeof INDEX_STATE)[keyof typeof INDEX_STATE];

    const [results, setResults] = useState<SearchResult[]>([]);
    const [index_state, setIndexState] = useState<INDEX_STATE>(INDEX_STATE.NOT_INITIALIZED);
    const [index, setIndex] = useState<UniSearchIndex | null>(null);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (index_state === INDEX_STATE.FETCHING) return;
        if (index_state !== INDEX_STATE.INITIALIZED) {
            setIndexState(INDEX_STATE.FETCHING);

            const response = await fetch("/searchindex.json");
            const response_json = await response.json();
            const newIndex = createIndexFromObject(response_json);

            if (newIndex instanceof UniSearchError) {
                console.error(newIndex);
                return;
            }

            setIndex(newIndex);

            setResults(await execSearch(newIndex, e.target.value));
            setIndexState(INDEX_STATE.INITIALIZED);
            return;
        }

        if (!index) return;
        setResults(await execSearch(index, e.target.value));
    };

    return (
        <section>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" onChange={handleSearch} />
            </div>
            <h2>results</h2>
            <ul>
                {index_state === INDEX_STATE.FETCHING && (<li>loading search index...</li>) }
                {results.length > 0 &&
                    results.map((r) => {
                        const post = r.key as SearchKey; // ad-hock solution. you might as well use zod or something like that to validate the key.
                        if(!post.data.title || !post.slug) throw new Error("title or slug is not found in the search result.");

                        return (
                            <li key={post.slug}>
                                <Link href={`/posts/${post.slug}`}>
                                    <h3>{post.data.title}</h3>
                                </Link>
                                <p>{r.refs[0].wordaround}</p>
                            </li>
                        );
                    })
                }
            </ul>
        </section>
    );
}

async function execSearch(index: UniSearchIndex, searchText: string): Promise<SearchResult[]> {
    const results = await search(index, searchText);
    return results instanceof UniSearchError ? [] : results;
}
```

"use client" is required to use React hooks. Index is fetched when the first search is executed to avoid unnecessary fetch.
Search results are rendered via useState hook of "results" state.

When the first search is executed, index is fetched from /searchindex.json, 'const response = await fetch("/searchindex.json")'.

After the index is fetched, it is converted to UniSearchIndex object by 'const index = createIndexFromObject(response.json())'.

Then, the search results are fetched by 'const results = await search(index, search_keyword)'.

Results are sorted by score, and you can use SearchResult type to render search results.
In this example, results[x].key.data.title and results[x].key.slug are used to link to the post page.
These information is indexed because key_fields is specified when creating index.
In addition, results[x].refs[0].wordaround is used to show the mached part of the text content.
