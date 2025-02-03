# StaticSeek Example (Astro.js)

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

Create a search page component (e.g., in `src/pages/index.astro`):

```astro
---
import Html from "../layout/html.astro";
---
<Html>
    <section>
        <div class="input-area">
            <div>Search</div>
            <input type="text" class="search" name="search" id="search" />
        </div>
        <h2>Results</h2>
        <ul class="search-result"></ul>
    </section>
</Html>

<script>
import { createIndexFromObject, search, StaticSeekError } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";
import type { SearchKey } from "./searchindex.json.ts";

function generateSearchFunction(result_element: HTMLElement) {
    const STATE = {
        NOT_INITIALIZED: 0,
        FETCHING: 1,
        INITIALIZED: 2
    } as const;
    type STATE = typeof STATE[keyof typeof STATE];

    let state: number = STATE.NOT_INITIALIZED;
    let index: StaticSeekIndex;

	return async (search_text: string) : Promise<SearchResult[] | null> => {
		if(state !== STATE.INITIALIZED) {
			if(state === STATE.FETCHING) return null;
			state = STATE.FETCHING;
			result_element.innerText = "Loading search index...";
			const response = await fetch("/searchindex.json");
			if(!response.ok) {
				console.error("fail to fetch index: " + response.statusText);
				result_element.innerText = "";
				state = STATE.NOT_INITIALIZED;
				return null;
			}
			const staticseek_index = createIndexFromObject(await response.json());
			if(staticseek_index instanceof StaticSeekError) {
				console.error(staticseek_index);
				result_element.innerText = "";
				state = STATE.NOT_INITIALIZED;
				return null;
			}
			index = staticseek_index;
			result_element.innerText = "";
			state = STATE.INITIALIZED;
		}

		const query_results = await search(index, search_text);
		if(query_results instanceof StaticSeekError) {
			console.error(query_results);
			return null;
		}

		return query_results;
	};
}

function generateResultHTMLElement(search_results: SearchResult[]): HTMLLIElement[] {
	const result = search_results.map(sr => {
		const post = sr.key as SearchKey;	// ad-hock solution. you might as well use zod or something like that to validate the key.
		if(!post.data.title || !post.id) throw new Error("title or id is not found in the search result.");

		const li = document.createElement("li");

		const h3 = document.createElement("h3");
		h3.appendChild(document.createTextNode(post.data.title));

		const a = document.createElement("a");
		a.setAttribute("href", `/posts/${post.id}`);
		a.appendChild(h3);

		const p = document.createElement("p");
		p.appendChild(document.createTextNode(sr.refs[0].wordaround ?? ""));

		li.appendChild(a);
		li.appendChild(p);

		return li;
	});

	return result;
}

const text = document.querySelector<HTMLInputElement>('.search');
const result = document.querySelector<HTMLElement>('.search-result');
if (!text || !result) throw new Error("Search input or result container not found");

const search_function = generateSearchFunction(result);

text?.addEventListener('input', async () => {
    if (text.value) {
        const search_results = await search_function(text.value);

        if (search_results && search_results.length !== 0) {
            result.innerText = "";
            generateResultHTMLElement(search_results).map((e) => result.appendChild(e));
        } else if (search_results !== null) {
            result.innerText = "No results found";
        }
    }
});
</script>
```

Important implementation details:
- The search functionality is implemented in vanilla TypeScript within an Astro component
- The search index is lazily loaded on the first search attempt to avoid unnecessary fetches
- Index fetching process:
  1. Fetch the index from `/searchindex.json` on first search
  2. Convert the response to `StaticSeekIndex` using `createIndexFromObject`
  3. Store the index in a closure for subsequent searches
- Search results are sorted by relevance score
- Each result includes:
  - The key fields specified during index creation (title and id)
  - Matched content context via `refs[*].wordaround`
  - Link to the full post using the id
- Error handling is implemented for both index creation and search operations

The search function maintains three states:
- `NOT_INITIALIZED`: Initial state before any search
- `FETCHING`: Index is being loaded
- `INITIALIZED`: Index is loaded and ready for searching
