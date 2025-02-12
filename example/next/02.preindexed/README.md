# StaticSeek Preindexed On-Demand Loading Example (Next.js)

A working demo of this implementation is available at [staticseek-next.pages.dev](https://staticseek-next.pages.dev/).

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
import type { IndexClass } from "staticseek";

export const dynamic = "force-static";
export const revalidate = false;

export type SearchKey = {
    slug: string;
    data: {
        title: string;
    };
};

export async function GET(request: Request) {
    const allPosts = await getAllPosts();
    const index_class: IndexClass = GPULinearIndex;
    const index = createIndex(index_class, allPosts, { key_fields: ["data.title", "slug"], search_targets: ["data.title", "content"] });
    if (index instanceof StaticSeekError) {
        return new Response(index.message, { status: 500 });
    }
    return Response.json(indexToObject(index));
}
```

Key configuration points:
- Set `dynamic = "force-static"` to ensure static file generation.
- Use `GPULinearIndex` for search functionality (other index types are available).
- The `allPosts` variable contains an array of posts, each with title, slug, and content fields.
- Configure `key_fields` to specify which fields should be available in search results (title and slug in this example).
- Use `search_targets` to define which fields should be searchable (title and content in this example).
- The index is converted to JSON using `indexToObject` before being returned.

### 2. Implementing the Search Interface

Create a search page component (e.g., in `src/app/page.tsx`):

```typescript
"use client";

import type { SearchKey } from "@/app/searchindex.json/route.ts";
import Link from "next/link";
import { lazy, useState } from "react";
import type { JSX } from "react";
import type { SearchResult } from "staticseek";

const StaticSeek = lazy(() => import("@/app/StaticSeek"));

function renderResult(result: SearchResult[]): JSX.Element {
    const lis = result.map((item) => {
        const key = item.key as SearchKey; // Ad-hoc solution; consider using Zod or a similar library for key validation.
        return (
            <li key={key.slug}>
                <Link href={`/posts/${key.slug as string}`}>
                    <h3>{key.data.title as string}</h3>
                </Link>
                <p>{item.refs[0].wordaround}</p>
            </li>
        );
    });

    return (
        <>
            <h2>Results</h2>
            <ul>{result.length > 0 ? lis : <li>No results found.</li>}</ul>
        </>
    );
}

export default function Index() {
    const [query, setQuery] = useState<string>("");
    const [trigger, setTrigger] = useState<boolean>(false);

    function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        setTrigger(true);
    }

    return (
        <main>
            <div className="input-area">
                <div>Search</div>
                <input type="text" name="search" id="search" placeholder="Type your search query in English..." onChange={onChangeInput} />
            </div>
            {trigger && <StaticSeek query={query} indexUrl="/searchindex.json" suspense={<div>Loading index...</div>} render={renderResult} />}
        </main>
    );
}
```

The StaticSeek component handles index loading and search execution.
- The component is loaded lazily using `lazy()`, ensuring that the search index is not loaded until the user types in the input field.
- The `query` prop is passed to StaticSeek to perform searches.
- The `indexUrl` prop points to the pre-generated search index JSON file.
- The `suspense` prop defines the JSX element displayed while the index is loading.
- The `render` prop specifies a function that converts `SearchResult[]` into JSX elements.

Important implementation details:
- Mark the component with `"use client"` to enable React hooks and client-side functionality.
- Search results are sorted by relevance score.
- Each result includes:
  - The key fields specified during index creation (title and slug).
  - Matched content context via `refs[*].wordaround`.
  - A link to the full post using the slug.

### 3. Index Loading and Search Execution

Create a component at `src/app/StaticSeek.tsx` to load the search index and execute queries:

```typescript
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";

type StaticSeekProps = {
    query: string;
    indexUrl: string;
    suspense: JSX.Element;
    render: (result: SearchResult[]) => JSX.Element;
};

export default function StaticSeek({ query, indexUrl, suspense, render }: StaticSeekProps) {
    const index = useRef<StaticSeekIndex | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<SearchResult[]>([]);

    const search_async = async () => {
        if (index.current) {
            const start = performance.now();
            const result = await search(index.current, query);
            if (result instanceof StaticSeekError) {
                console.error(`Search failed: ${result.message}`);
                return;
            }
            console.log(`Search took ${performance.now() - start} ms`);
            setResult(result);
        }
    };

    useEffect(() => {
        const fetchIndex = async () => {
            const start = performance.now();
            const response = await fetch(indexUrl);
            if (!response.ok) {
                console.error(`Failed to fetch index: ${response.statusText}`);
                return;
            }
            const response_json = await response.json();
            const newIndex = createIndexFromObject(response_json);
            if (newIndex instanceof StaticSeekError) {
                console.error(`Index creation failed: ${newIndex.message}`);
                return;
            }
            console.log(`Index loading took ${performance.now() - start} ms`);
            index.current = newIndex;
            setLoading(false);
            search_async();
        };

        if (!index.current) {
            fetchIndex();
        }
    }, []);

    useEffect(() => {
        search_async();
    }, [query]);

    return loading ? suspense : render(result);
}
```

Key Implementation Details:
- The search index is loaded only once during component initialization using useEffect, with an empty dependency array [] to ensure it runs only on mount.
- The search index does not trigger re-renders, so it is stored in a useRef rather than useState.
- Since the search function is asynchronous, the useEffect dependency array includes query, ensuring that a new search is executed whenever the query changes.
- The search results are passed to the render function, which converts them into JSX elements.
