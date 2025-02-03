# StaticSeek Example (React + Next.js)

A working demo of this implementation is available at [staticseek-react-next.pages.dev](https://staticseek-react-next.pages.dev/).

## Getting Started

To run the development server locally:

```bash
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Deployment

This example is optimized for static file deployment. To generate and deploy the static files:

```bash
npm install
npm run build
# Upload the generated "out" directory to your HTTP server
```

## Integration Guide: StaticSeek with Next.js

### 1. Creating the Search Index

First, create a static index file. The following example demonstrates how to set this up at `src/app/searchindex.json/route.ts`:

```typescript
import { getAllPosts } from "@/lib/posts";
import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";

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
    const index = createIndex(GPULinearIndex, allPosts, {
        key_fields: ["data.title", "slug"],
        search_targets: ["data.title", "content"]
    });

    if (index instanceof StaticSeekError) {
        return new Response(index.message, { status: 500 });
    }
    
    return Response.json(indexToObject(index));
}
```

Key configuration points:
- Set `dynamic = "force-static"` to ensure static file generation
- Use `GPULinearIndex` for search functionality (other index types are available)
- The `allPosts` variable contains an array of posts, each with title, slug, and content fields
- Configure `key_fields` to specify which fields should be available in search results (title and slug in this example)
- Use `search_targets` to define which fields should be searchable (title and content in this example)
- Index is converted to JSON using `indexToObject` before being returned

### 2. Implementing the Search Interface

Create a search page component (e.g., in `src/app/page.tsx`):

```typescript
"use client";

import Link from "next/link";
import { useState } from "react";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";
import type { SearchKey } from "@/app/searchindex.json/route";

export default function Index() {
    const INDEX_STATE = {
        NOT_INITIALIZED: 0,
        FETCHING: 1,
        INITIALIZED: 2,
    } as const;
    type INDEX_STATE = (typeof INDEX_STATE)[keyof typeof INDEX_STATE];

    const [results, setResults] = useState<SearchResult[]>([]);
    const [index_state, setIndexState] = useState<INDEX_STATE>(INDEX_STATE.NOT_INITIALIZED);
    const [index, setIndex] = useState<StaticSeekIndex | null>(null);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const start = performance.now();
        if (index_state === INDEX_STATE.FETCHING) return;
        if (index_state !== INDEX_STATE.INITIALIZED) {
            setIndexState(INDEX_STATE.FETCHING);

            const response = await fetch("/searchindex.json");
            if (!response.ok) {
                console.error(`fail to fetch index: ${response.statusText}`);
                setIndexState(INDEX_STATE.NOT_INITIALIZED);
                return;
            }
            const response_json = await response.json();
            const newIndex = createIndexFromObject(response_json);

            if (newIndex instanceof StaticSeekError) {
                console.error(newIndex);
                setIndexState(INDEX_STATE.NOT_INITIALIZED);
                return;
            }

            setIndex(newIndex);

            setResults(await execSearch(newIndex, e.target.value));
            setIndexState(INDEX_STATE.INITIALIZED);
            console.log(`search time: ${performance.now() - start}ms`);
            return;
        }

        if (!index) return;
        const results = await search(index, e.target.value);
        if (results instanceof StaticSeekError) {
            console.error(results);
            return;
        }
        setResults(results);
        console.log(`search time: ${performance.now() - start}ms`);
    };

    return (
        <section>
            <div className="input-area">
                <div>Search</div>
                <input type="text" name="search" id="search" onChange={handleSearch} />
            </div>
            <h2>Results</h2>
            <ul>
                {index_state === INDEX_STATE.FETCHING && (
                    <li>Loading search index...</li>
                )}
                {results.length > 0 &&
                    results.map((r) => {
                        const post = r.key as SearchKey; // Type assertion - consider using Zod or similar for validation
                        if (!post.data.title || !post.slug) {
                            throw new Error("Title or slug not found in search result.");
                        }

                        return (
                            <li key={post.slug}>
                                <Link href={`/posts/${post.slug}`}>
                                    <h3>{post.data.title}</h3>
                                </Link>
                                <p>{r.refs[0].wordaround}</p>
                            </li>
                        );
                    })}
            </ul>
        </section>
    );
}

async function execSearch(index: StaticSeekIndex, searchText: string): Promise<SearchResult[]> {
    const results = await search(index, searchText);
    return results instanceof StaticSeekError ? [] : results;
}
```

Important implementation details:
- Mark the component with `"use client"` to enable React hooks and client-side functionality
- The search index is lazily loaded on the first search attempt to avoid unnecessary fetches
- Index fetching process:
  1. Fetch the index from `/searchindex.json` on first search
  2. Convert the response to `StaticSeekIndex` using `createIndexFromObject`
  3. Store the index in component state for subsequent searches
- Search results are sorted by relevance score
- Each result includes:
  - The key fields specified during index creation (title and slug)
  - Matched content context via `refs[*].wordaround`
  - Link to the full post using the slug
- Error handling is implemented for both index creation and search operations

The component manages three main states:
- `results`: Array of search results
- `index_state`: Tracks the loading state of the search index
- `index`: Stores the initialized StaticSeekIndex object
