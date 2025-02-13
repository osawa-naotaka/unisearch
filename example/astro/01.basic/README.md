# staticseek Example (Astro.js)

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

## Basic Usage of staticseek with Astro.js

The following code (`src/pages/index.astro`) demonstrates the most basic usage of staticseek in a Single Page Application (SPA).
This application extracts and displays matching keywords from a predefined array.
For input queries of two or fewer characters, an exact match search is performed. For queries of three or more characters, a fuzzy search allowing one character mistake is executed.

```html
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

For simplicity, this example uses `innerHTML`. However, in production applications, you should use `createElement` and `appendChild` methods instead of `innerHTML` to mitigate security risks associated with direct HTML injection.

While staticseek operates on the client side, code written in the Astro component's component script section only executes once during deployment. Therefore, staticseek is [implemented within a script element in the component template](https://docs.astro.build/en/guides/client-side-scripts/). For production applications, we recommend using a full-text search component built with React or similar frameworks, marked with the `client:visible` property.

This example retrieves search target data from Astro's Content Collections. The content collection directory structure and data schema are defined in `src/content.config.ts`. The sample uses the `getEntry()` function to fetch data from `sentences.json` within the `contents` directory.

JavaScript objects retrieved via `getEntry()` can only be used within the component script section and HTML descriptions in the component template section. To use JavaScript objects within `script` elements, we leverage [HTML data attributes](https://docs.astro.build/en/guides/client-side-scripts/#pass-frontmatter-variables-to-scripts). These data attributes allow you to specify custom attributes on HTML elements, enabling the transfer of JavaScript objects as stringified data that can be retrieved and parsed within `script` elements.

When passing JavaScript objects through data attributes, the objects are bundled as attribute values in the final HTML file. Therefore, passing large objects can significantly increase the HTML file size, potentially slowing down browser loading times. When using this approach, carefully consider the size of the objects being transferred to maintain optimal performance.

- The search index is created by passing the keyword array to `createIndex`.
- The search query is input via a text field (`input:text`), and searches are executed on each `input` event.
- Search results are displayed using the `id` field from the `SearchResult` type, which corresponds to the index of the keyword in the original `target` array.

### Additional Notes

- Search results are sorted by relevance score.
- Error handling is implemented for both index creation and search operations.
