# StaticSeek Example (Next.js)

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

import type { SearchKey } from "@/app/searchindex.json/route.ts";
import Link from "next/link";
import { lazy, useState } from "react";
import type { JSX } from "react";
import type { SearchResult } from "staticseek";

const StaticSeek = lazy(() => import("@/app/StaticSeek"));

function renderResult(result: SearchResult[]): JSX.Element {
    const lis = result.map((item) => {
        const key = item.key as SearchKey; // ad-hock solution. you might as well use zod or something like that to validate the key.
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
            <h2>results</h2>
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
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="type your search query in English..." onChange={onChangeInput} />
            </div>
            {trigger && <StaticSeek query={query} indexUrl="/searchindex.json" suspense={<div>Loading index...</div>} render={renderResult} />}
        </main>
    );
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
