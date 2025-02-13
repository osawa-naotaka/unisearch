# StaticSeek Example (Astro.js)

A working demo of this implementation is available at [staticseek-astro-basic.pages.dev](https://staticseek-astro-basic.pages.dev/).

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

## Basic Usage of StaticSeek with Next.js

The following code (`src/pages/index.astro`) demonstrates the most basic usage of StaticSeek in a Single Page Application (SPA).
This application extracts and displays matching keywords from a predefined array.
For input queries of two or fewer characters, an exact match search is performed. For queries of three or more characters, a fuzzy search allowing one character mistake is executed.

```typescript
---
import Html from "../layout/html.astro";
import { getEntry } from "astro:content";

const entry = await getEntry("contents", "sentences");
if(!entry) throw new Error("No data found");
---
<Html>
	<section>
		<div class="input-area">
			<div>search</div>
			<input type="text" name="search" id="search" placeholder="Enter the following keywords" />
		</div>
		<ul class="search-result" data-target={JSON.stringify(entry.data)}>
		</ul>
	</section>
</Html>

<script>
	import { createIndex, LinearIndex, search, StaticSeekError } from "staticseek";

	const search_result_element = document.querySelector<HTMLUListElement>(".search-result");
	if(!search_result_element) throw new Error("No search result element found");
	const target_string = search_result_element.dataset.target;
	const target = JSON.parse(target_string ?? "") as string[];

	const index = createIndex(LinearIndex, target);
	if(index instanceof StaticSeekError) throw index;

	const search_input = document.querySelector<HTMLInputElement>("#search");
	search_input?.addEventListener("input", async (e) => {
		const query = search_input.value;
		const result = await search(index, query);
		if(result instanceof StaticSeekError) throw result;

		search_result_element.innerHTML = '<li><div class="sentence">sentence</div><div>score</div></li>';

		if(query.length === 0) {
			for(const r of target) {
				const li = document.createElement("li");
				li.innerHTML = `<div class="sentence">${r}</div><div></div>`;
				search_result_element.appendChild(li);
			};
		} else {
			for(const r of result) {
				const li = document.createElement("li");
				li.innerHTML = `<div class="sentence">${target[r.id]}</div><div class="score">${r.score.toFixed(4)}</div>`;
				search_result_element.appendChild(li);
			};
		}
	});
	search_input?.dispatchEvent(new Event("input"));
</script>
```

### Implementation Details

この例では簡略化のため、innerHTMLを利用しています。一般にinnerHTMLの使用は
セキュリティ上のリスクになるため、実際のアプリケーションでは
createElementとappendChildrenを利用してください。

staticseekはクライアント側で動かしますが、Astroコンポーネントのコンポーネントスクリプト部に書かれたコードは
デプロイ時に一度だけしか動きません。そのため、コンポーネントテンプレート中にscript要素を定義し、
そこでstaticseekを使います。
実用的なアプリケーションでは、Reactなどで作られた全文検索コンポーネントをclient:visibleプロパティ付きで
利用することをお勧めします。
[Reactを用いたサンプル](https://github.com/osawa-naotaka/staticseek/tree/main/example/astro/02.preindexed)をご参照ください。

本サンプルでは、検索対象のデータはAstroのコンテンツコレクションから取得します。
コンテンツコレクションのディレクトリやデータ構造は src/content.config.ts で定義され、
本サンプルでは contentsディレクトリ内のsentences.jsonをgetEntry()関数を用いて取得します。

getEntryで取得したコンテンツのjavascriptオブジェクトは、コンポーネントスクリプト部、および、コンポーネントテンプレート部にかかれたhtml記述の中でしか使えません。javascriptオブジェクトをscript要素の中で使うには、
[htmlのデータ属性を利用します](https://docs.astro.build/en/guides/client-side-scripts/#pass-frontmatter-variables-to-scripts)。データ属性は、htmlの要素に任意の属性を指定できます。javascriptオブジェクトを文字列に変換し、データ属性を通じてscript要素の中で取得することができます。

データ属性を通じたjavascriptオブジェクトの受け渡しでは、最終的に出力されるhtmlファイルの中に属性値として
オブジェクトがバンドルされます。そのため、大きすぎるオブジェクトを受け渡すと、htmlファイルのサイズが
大きくなってしまい、ブラウザへの読み込みが遅くなります。
この手法を用いる場合は、オブジェクトサイズに気を付けるようにしてください。

- The search index is created by passing the keyword array to `createIndex`.
- The search query is input via a text field (`input:text`), and searches are executed on each `input` event.
- Search results are displayed using the `id` field from the `SearchResult` type, which corresponds to the index of the keyword in the original `target` array.

### Additional Notes

- Search results are sorted by relevance score.
- Error handling is implemented for both index creation and search operations.














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
