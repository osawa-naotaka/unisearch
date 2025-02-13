# staticseek Example (Astro.js)

A working demo of this implementation is available at [staticseek-astro.pages.dev](https://staticseek-astro.pages.dev/).

## Getting Started

To run the development server locally:

```bash
npm install
npm run dev
```

Navigate to [http://localhost:4321](http://localhost:4321) in your browser to view the application.

## Deployment

This example is optimized for static file deployment. To generate and deploy the static files:

```bash
npm install
npm run build
# Upload the generated "dist" directory to your HTTP server
```

## Integration Guide: StaticSeek with Astro.js

### 1. Creating the Search Index

First, create a static index file. The following example demonstrates how to set this up at `src/pages/searchindex.json.ts`:

```typescript
import { getCollection } from "astro:content";
import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";

export type SearchKey = {
    id: string;
    data: {
      title: string;
    }
};

export async function GET() {
    const posts = (await getCollection("posts"));
    const linear_index = createIndex(GPULinearIndex, posts, {
        search_targets: ["body", "data.title"],
        key_fields: ["data.title", "id"],
    });

    if (linear_index instanceof StaticSeekError) {
        return new Response(null, { status: 500, statusText: linear_index.message });
    }

    return new Response(JSON.stringify(indexToObject(linear_index)));
}
```

Key configuration points:
- Use `GPULinearIndex` for search functionality (other index types are available)
- Posts are retrieved using Astro's `getCollection` function from the content collection
- Collection directory and schema are defined in `src/content.config.ts`
- Configure `key_fields` to specify which fields should be available in search results (title and id in this example)
- Use `search_targets` to define which fields should be searchable (body and title in this example)
- Index is converted to JSON using `indexToObject` before being returned

### 2. Implementing the Search Interface

Create a search page component (e.g., in `src/components/Search.tsx`) using React and [staticseek-react](https://github.com/osawa-naotaka/staticseek-react):

```javascript
import type { SearchKey } from "../pages/searchindex.json";
import { lazy, useState } from "react";
import type { JSX } from "react";
import type { SearchResult } from "staticseek";

const StaticSeek = lazy(() => import("staticseek-react"));

function StaticSeekResult(result: SearchResult[]): JSX.Element {
    const lis = result.map((item) => {
        const key = item.key as SearchKey; // ad-hock solution. you might as well use zod or something like that to validate the key.
        return (
            <li key={key.id}>
                <a href={`/posts/${key.id}`}>
                    <h3>{key.data.title}</h3>
                </a>
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

export default function Search() {
    const [query, setQuery] = useState<string>("");
    const [trigger, setTrigger] = useState<boolean>(false);

    function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        setTrigger(true);
    }

    return (
        <section>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="type your search query in English..." onChange={onChangeInput} />
            </div>
            {trigger && (
                <StaticSeek query={query} indexUrl="/searchindex.json" suspense={<div>Loading index...</div>}>
                    {StaticSeekResult}
                </StaticSeek>
            )}
        </section>
    );
}
```

The StaticSeek component handles index loading and search execution.
- The component is loaded lazily using `lazy()`, ensuring that the search index is not loaded until the user types in the input field.
- The `query` prop is passed to StaticSeek to perform searches.
- The `indexUrl` prop points to the pre-generated search index JSON file.
- The `suspense` prop defines the JSX element displayed while the index is loading.
- The children of StaticSeek specifies a function that converts `SearchResult[]` into JSX elements.

Important implementation details:
- Mark the component with `<Search client:visible />` in `src/pages/index.astro` to enable React hooks and client-side functionality.
- Search results are sorted by relevance score.
- Each result includes:
  - The key fields specified during index creation (title and slug).
  - Matched content context via `refs[*].wordaround`.
  - A link to the full post using the slug.

### 3. Index Loading and Search Execution

The `StaticSearch` React component, provided by the npm package [staticseek-react](https://github.com/osawa-naotaka/staticseek-react), is responsible for loading the search index and executing queries. The complete implementation is shown below:

```typescript
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";

type StaticSeekProps = {
    query: string;
    indexUrl: string;
    suspense: JSX.Element;
    children: (result: SearchResult[]) => JSX.Element;
};

export default function StaticSeek({ query, indexUrl, suspense, children }: StaticSeekProps) {
    const index = useRef<StaticSeekIndex | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<SearchResult[]>([]);

    const search_async = async () => {
        if (index.current) {
            const result = await search(index.current, query);
            if (result instanceof StaticSeekError) {
                console.error(`fail to search: ${result.message}`);
                return;
            }
            setResult(result);
        }
    };

    useEffect(() => {
        const fetchIndex = async () => {
            const response = await fetch(indexUrl);
            if (!response.ok) {
                console.error(`fail to fetch index: ${response.statusText}`);
                return;
            }
            const response_json = await response.json();
            const newIndex = createIndexFromObject(response_json);
            if (newIndex instanceof StaticSeekError) {
                console.error(`fail to create index: ${newIndex.message}`);
                return;
            }
            index.current = newIndex;
            setLoading(false);
            search_async();
        };

        if (index.current === null) {
            fetchIndex();
        }

        return () => {};
    }, []);

    useEffect(() => {
        search_async();
        return () => {};
    }, [index, query]);

    return loading ? suspense : children(result);
}
```

Key Implementation Details:
- The search index is loaded only once during component initialization using useEffect, with an empty dependency array [] to ensure it runs only on mount.
- The search index does not trigger re-renders, so it is stored in a useRef rather than useState.
- Since the search function is asynchronous, the useEffect dependency array includes query, ensuring that a new search is executed whenever the query changes.
- The search results are passed to the render function, which converts them into JSX elements.
