# staticseek.js example (Astro)

This example is deployed on [https://staticseek-astro.pages.dev/](https://staticseek-astro.pages.dev/).

## Getting Started

to run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) with your browser to see the result.

this example is for static files deployment.

to deploy static files:

```bash
npm install
npm run build
(upload "dist" directory to your http server)
```

## How to use staticseek.js with Astro.js

### 1. Create index to static file

At first, you need to create index. In this example, src/pages/searchindex.json.ts is used to create index static file, and /searchindex.json is the path to the index file.

```ts
import { getCollection } from "astro:content";
import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek.js";

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

In this example, index is created using GPULinearIndex, but you can use other index types.
posts is retrived from Astro.js collection using getCollection function.
corection directory and schema of posts are specified at src/content.config.ts.
Variable posts is an array of posts, and each post has title, id and content fields. All of them are indexed by default, but you can specify search_targets to index only specific fields. In this example, title and body are indexed, and id is not indexed.
When calling createIndex function, key_fields is specified to use title and id when rendering search results.
After that, index is converted to JSON object by indexToObject function, and returned as Response object.

### 2. Create search page

Next, you need to create search page. src/pages/index.astro is used for this purpose.

```astro
---
import Html from "../layout/html.astro";
---
<Html>
	<section>
		<div class="input-area">
			<div>search</div>
			<input type="text" class="search" name="search" id="search" />
		</div>
		<h2>results</h2>
		<ul class="search-result"></ul>
	</section>
</Html>

<script>
import { createIndexFromObject, search, StaticSeekError } from "staticseek.js";
import type { SearchResult, StaticSeekIndex } from "staticseek.js";
import type { SearchKey } from "./searchindex.json.ts";

function generateSearchFunction(result_element: HTMLElement) {
	const STATE = {
		NOT_INITIALIZED: 0,
		FETCHING: 1,
		INITIALIZED: 2
	} as const;
	type STATE = typeof STATE[keyof typeof STATE];

	let state : number = STATE.NOT_INITIALIZED;
	let index: StaticSeekIndex;

	return async (search_text: string) : Promise<SearchResult[] | null> => {
		if(state !== STATE.INITIALIZED) {
			if(state === STATE.FETCHING) return null;
			state = STATE.FETCHING;
			result_element.innerText = "loading search index...";
			const response = await fetch("/searchindex.json");
			const staticseek_index = createIndexFromObject(await response.json());
			if(staticseek_index instanceof StaticSeekError) throw staticseek_index;
			index = staticseek_index;
			result_element.innerText = "";
			state = STATE.INITIALIZED;
		}

		const query_results = await search(index, search_text);
		if(query_results instanceof StaticSeekError) {
			throw query_results;
		}

		return query_results;
	};
}

const text   = document.querySelector<HTMLInputElement>('.search');
const result = document.querySelector<HTMLElement>('.search-result');
if(!text || !result) throw new Error("text or result is not found");

const search_function = generateSearchFunction(result);

text?.addEventListener('input', async () =>
{
	if(text.value) {
		const search_results = await search_function(text.value);

		if(search_results && search_results.length !== 0) {
			result.innerText = "";
			generateResultHTMLElement(search_results).map((e) => result.appendChild(e));
		} else if(search_results !== null) {
			result.innerText = "not found";
		}
	}
});
</script>
```

Index is fetched when the first search is executed to avoid unnecessary fetch.
Search results are rendered when the search text is changed.

When the first search is executed, index is fetched from /searchindex.json, 'const index_tmp = await fetch("/searchindex.json")'.

After the index is fetched, it is converted to StaticSeekIndex object by 'const staticseek_index = createIndexFromObject(await response.json())'.

Then, the search results are fetched by 'const query_results = await search(staticseek_index, search_text)'.

Results are sorted by score, and you can use SearchResult type to render search results.
In this example, results[x].key.data.title and results[x].key.id are used to link to the post page.
These information is indexed because key_fields is specified when creating index.
In addition, results[x].refs[0].wordaround is used to show the mached part of the text content.
