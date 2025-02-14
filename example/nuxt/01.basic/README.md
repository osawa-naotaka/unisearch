# staticseek Example (Nuxt.js)

Experience a live demonstration of this implementation at [staticseek-nuxt-basic.pages.dev](https://staticseek-nuxt-basic.pages.dev/).

## Getting Started

Launch the development server locally with these commands:

```bash
npm install
npm run dev
```

Open your browser and visit [http://localhost:3000](http://localhost:3000) to see the application in action.

## Deployment

This example is optimized for static hosting. Generate and deploy the static files with these steps:

```bash
npm install
npm run generate
# Upload the generated ".output/public" directory to your HTTP server
```

## Basic Usage of staticseek with Astro.js

The following implementation (`pages/index.vue`) showcases the fundamental usage of staticseek in a Single Page Application (SPA).
The application searches through a predefined array and highlights matching keywords. It employs two search modes:
- For queries of 1-2 characters: Exact match search
- For queries of 3+ characters: Fuzzy search with single-character tolerance

```html
<script setup lang="ts">
import { LinearIndex, StaticSeekError, createIndex, search } from "staticseek";
import type { SearchResult } from "staticseek";

const query = ref("");
const result = ref<SearchResult[]>([]);
const { data } = await useAsyncData("search", () =>
    queryCollection("contents").where("stem", "=", "sentences").first(),
);
const target = data.value?.data ?? [];

const index = createIndex(LinearIndex, target);
if (index instanceof StaticSeekError) throw index;

watch(query, async (q) => {
    const searchResults = await search(index, q);
    if (searchResults instanceof StaticSeekError) {
        console.error(searchResults);
        result.value = [];
        return;
    }

    result.value = searchResults;
}, { immediate: true });

</script>

<template>
    <section>
        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" v-model="query"/>
        </div>
        <h2>results</h2>
        <ul>
            <li key="header">
                <div class="sentence">sentence</div>
                <div>score</div>
            </li>
            <template v-if="!(result instanceof StaticSeekError) && query.length !== 0">
                <li v-for="r in result" :key="r.id">
                    <div class="sentence">{{ target[r.id] }}</div>
                    <div class="score">{{ r.score.toFixed(4) }}</div>
                </li>
            </template>
            <template v-else-if="query.length === 0">
                <li v-for="r in target" :key="r">
                    <div class="sentence">{{ r }}</div>
                    <div></div>
                </li>
            </template>
        </ul>
    </section>
</template>
```

### Implementation Details

This example leverages [Nuxt Content](https://content.nuxt.com/) for data retrieval. The content collection structure and data schema are defined in `content.config.ts`. Data is fetched from `sentences.json` in the `contents` directory using the `queryCollection()` function.

The search functionality is implemented through several key components:

- A search index is initialized by passing the keyword array to `createIndex`
- User input is captured through a text field, binding to the `query` variable
- Search execution is automated using `watch`, which triggers a new search whenever `query` changes and updates the `result` variable
- Search results are referenced using the `SearchResult` type's `id` field, which maps to the original keyword's position in the `target` array

### Additional Notes

- Results are automatically sorted by relevance score
- Comprehensive error handling is implemented for both index creation and search operations
