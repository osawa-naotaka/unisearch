# Basic Integration Guide for Next.js

This guide demonstrates how to integrate staticseek into a Next.js application. You can find the complete implementation in our [GitHub repository](https://github.com/osawa-naotaka/staticseek/tree/main/example/next/01.basic) and see it in action at our [live demo](https://staticseek-next-basic.pages.dev/).

## Development Setup

To start the local development server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## Production Deployment

This project is optimized for static file hosting. To generate and deploy static files:

```bash
npm install
npm run build
# Upload the generated "out" directory to your HTTP server
```

## Basic staticseek Implementation

The following code (`src/app/page.tsx`) demonstrates the simplest implementation of staticseek in a Single Page Application (SPA). This application searches and displays matching keywords from a predefined array.


```typescript
// src/app/page.tsx
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
            console.error(newIndex);
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

#### Core Components

- The search index is created by passing the keyword array to `createIndex`
- Index creation occurs once per component lifecycle through a `useEffect` hook with an empty dependency array (`[]`)
- The search index is stored in a useRef variable to prevent triggering re-renders
- Search queries are handled via a text field (`input:text`), with searches executing on each onChange event
- The `search` function operates asynchronously, requiring an async event handler
- Search results utilize the `id` field from the `SearchResult` type to reference the original `target` array index

#### Technical Considerations

- The `"use client"` directive enables React hooks and client-side functionality
- Search results are automatically sorted by relevance score
- Error handling is implemented for both index creation and search operations
