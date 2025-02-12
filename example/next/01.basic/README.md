# StaticSeek Basic Example (Next.js)

A working demo of this implementation is available at [staticseek-next-basic.pages.dev](https://staticseek-next-basic.pages.dev/).

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

## Basic Usage of StaticSeek with Next.js

The following code (`src/app/page.tsx`) demonstrates the most basic usage of StaticSeek in a Single Page Application (SPA).
This application extracts and displays matching keywords from a predefined array.
For input queries of two or fewer characters, an exact match search is performed. For queries of three or more characters, a fuzzy search allowing one character mistake is executed.

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { LinearIndex, createIndex, search, StaticSeekError } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";

const target = [
    "apple", "bridge", "candle", "dragon", "eclipse",
    "feather", "glacier", "horizon", "island", "jungle",
    "knight", "lantern", "mountain", "nebula", "ocean",
    "puzzle", "quartz", "raven", "spectrum", "tornado"
];

export default function Index() {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<SearchResult[]>([]);
    const index = useRef<StaticSeekIndex | null>(null);

    useEffect(() => {
        const newIndex = createIndex(LinearIndex, target);
        if (newIndex instanceof StaticSeekError) {
            console.error(index);
            return;
        }
        index.current = newIndex;
    }, []);

    async function execSearch(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        if (index.current) {
            const r = await search(index.current, e.target.value);
            if (r instanceof StaticSeekError) {
                console.error(r);
                return;
            }
            setResult(r);
        }
    }

    return (
        <section>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="Enter the following keywords" onChange={execSearch} />
            </div>
            <ol>
                <li key="header">
                    <div className="sentence">sentence</div>
                    <div>score</div>
                </li>
                {result.length === 0 && query === ""
                    ? target.map((r, idx) => (
                          // biome-ignore lint: use index as key field.
                          <li key={idx}>
                              <div className="sentence">{r}</div>
                              <div />
                          </li>
                      ))
                    : result.map((r) => (
                          <li key={r.id}>
                              <div className="sentence">{target[r.id]}</div>
                              <div className="score">{r.score.toFixed(4)}</div>
                          </li>
                      ))}
            </ol>
        </section>
    );
}
```

### Implementation Details

- The search index is created by passing the keyword array to `createIndex`.
- Since index creation only needs to happen once per component lifecycle, it is executed inside a `useEffect` hook with an empty dependency array (`[]`).
- The search index does not trigger re-renders, so it is stored in a `useRef` variable.
- The search query is input via a text field (`input:text`), and searches are executed on each `onChange` event.
- As the `search` function is asynchronous, the event handler is also an `async` function.
- Search results are displayed using the `id` field from the `SearchResult` type, which corresponds to the index of the keyword in the original `target` array.

### Additional Notes

- The component is marked with `"use client"` to enable React hooks and client-side functionality.
- Search results are sorted by relevance score.
- Error handling is implemented for both index creation and search operations.
