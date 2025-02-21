# Prepare index at deployment and read index on-demand (Next.js)

Complete project files for this implementation are published on the [Github staticseek repository](https://github.com/osawa-naotaka/staticseek/tree/main/example/next/02.preindexed).

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

## Integration Guide: staticseek with Next.js

### 1. Creating the Search Index

First, create a static index file. The following example demonstrates how to set this up at `src/app/searchindex.json/route.ts`:

```typescript
// src/app/searchindex.json/route.ts
import { getAllPosts } from "@/lib/posts";
import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET(request: Request) {
    const allPosts = await getAllPosts();
    const index = createIndex(GPULinearIndex, allPosts, { key_fields: ["data.title", "slug"], search_targets: ["data.title", "content"] });
    if (index instanceof StaticSeekError) {
        return new Response(index.message, { status: 500 });
    }
    return Response.json(indexToObject(index));
}
```

```typescript
// src/lib/posts.ts
import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type Post = {
    slug: string;
    data: Record<string, unknown>;
    content: string;
};

const postsDirectory = path.join(path.resolve(), "..", "..", "posts");

export function getPostSlugs(): string[] {
    return fs
        .readdirSync(postsDirectory)
        .filter((file) => file.endsWith(".md"))
        .map((file) => file.replace(/\.md$/, ""));
}

export async function getPostBySlug(slug: string): Promise<Post> {
    const mdxpath = path.join(postsDirectory, `${slug}.md`);
    const text = await readFile(mdxpath, { encoding: "utf-8" });
    const { data, content } = matter(text);
    return { slug, content, data };
}

export async function getAllPosts(): Promise<Post[]> {
    return await Promise.all(getPostSlugs().map((slug) => getPostBySlug(slug)));
}
```

### Key Configuration Points
- Set `dynamic = "force-static"` to ensure static file generation.
- Use `GPULinearIndex` for search functionality (other index types are available).
- The `allPosts` variable contains an array of posts, each with title, slug, and content fields.
- Configure `key_fields` to specify which fields should be available in search results (title and slug in this example).
- Use `search_targets` to define which fields should be searchable (title and content in this example).
- The index is converted to JSON using `indexToObject` before being returned.

### 2. Implementing the Search Interface

Create a search page component (e.g., in `src/app/page.tsx`):

```typescript
// src/app/page.tsx
"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { JSX } from "react";
import { createSearchFn, SearchResult, StaticSeekError } from "staticseek";
import type { SearchFn } from "staticseek";
import * as v from "valibot";

const schema = v.object({
    slug: v.string(),
    data: v.object({
        title: v.string(),
    }),
});

function StaticSeekResult(result: SearchResult[]): JSX.Element {
    const lis = result.map((item) => {
        const key = v.parse(schema, item.key);
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
    const search_fn = useRef<SearchFn>(null);
    const [result, setResult] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        search_fn.current = createSearchFn("/searchindex.json", setIsLoading);
    }, [])

    async function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
        if (search_fn.current) {
            const r = await search_fn.current(e.target.value);
            if (!(r instanceof StaticSeekError)) {
                setResult(r);
            }
        }
    }

    return (
        <main>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="type your search query in English..." onChange={onChangeInput} />
            </div>
            {isLoading ? (<div>Loading index...</div>) : StaticSeekResult(result)}
        </main>
    );
}
```

### Implementation Details

- Mark the component with `"use client"` to enable React hooks and client-side functionality.
- The search function `search_fn` is created by `createSearchFn` only once during component initialization using `useEffect`, with an empty dependency array [] to ensure it runs only on mount.
- The created search function `search_fn` itself does not trigger re-renders, so it is stored in a useRef rather than useState.
- Index is loaded at the first call of `search_fn` to prevent unused fetch of index.
- Index loading state is triggered by callback function given to the `createSearchFn`.
- Search results are sorted by relevance score.
- Each result includes:
  - The key fields specified during index creation (title and slug).
  - Matched content context via `refs[*].wordaround`.
  - A link to the full post using the slug.
