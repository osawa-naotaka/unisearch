# staticseek Example (Nuxt)

Experience a live demonstration of this implementation at [staticseek-nuxt.pages.dev](https://staticseek-nuxt.pages.dev/).

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

## Integration Guide: StaticSeek with Nuxt

### 1. Creating the Search Index

First, create a static index file. The following example demonstrates how to set this up at `server/routes/searchindex.json.ts`:

```typescript
import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";
import type { IndexClass } from "staticseek";
import matter from "gray-matter";

export default defineEventHandler(async (event) => {
    const raw_posts = await queryCollection(event, "posts").all();
    const posts = raw_posts.map((post) => ({ stem: post.stem, body: matter(post.rawbody.replaceAll("\\n", "\n")) }));

    const index_class: IndexClass = GPULinearIndex;
    const index = createIndex(index_class, posts, { 
        key_fields: ["stem", "body.data.title"], 
        search_targets: ["body.data.title", "body.content"] 
    });
    
    if (index instanceof StaticSeekError) {
        throw createError({
            statusCode: 500,
            message: index.message
        });
    }
    
    return indexToObject(index);
});
```

To use `rawbody` of the posts, config schema in `content.config.ts`:

```typescript
import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    posts: defineCollection({
        type: 'page',
        source: 'posts/*.md',
        schema: z.object({
          title: z.string(),
          rawbody: z.string(),
        }),
      }),
    }
  },
);
```

Key configuration points:
- Use `GPULinearIndex` for search functionality (other index types are available)
- Posts are retrieved using Nuxt Content's `queryCollection` function from the content collection
- Collection directory and schema are defined in `content.config.ts`
- Configure `key_fields` to specify which fields should be available in search results (title and stem in this example)
- Use `search_targets` to define which fields should be searchable (content and title in this example)
- Index is converted to JSON using `indexToObject` before being returned

### 2. Implementing the Search Interface

Create a search page (e.g., in `pages/index.vue`) using StaticSeek component ( `component/StaticSeek.vue` )

```vue
<script setup lang="ts">
import StaticSeek from "../component/StaticSeek.vue";

// ad-hock solution. you might as well use zod or something like that to validate the key.
function typedKey(key: Record<string, unknown>) {
    return key as { stem: string; body: { data: { title: string } } };
}

const query = ref("");
const trigger = ref(false);
</script>

<template>
    <section>
        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" v-model="query" @input="() => { trigger = true }"/>
        </div>
        <StaticSeek v-if="trigger" :query="query" url="/searchindex.json">
            <template #default="{ results }">
                <h2>results</h2>
                <ul>
                    <li v-if="results.length === 0 && query.length !== 0">No results found.</li>
                    <template v-else>
                        <li v-for="{refs, key} in results" :key="typedKey(key).stem">
                            <NuxtLink :href="typedKey(key).stem" >
                                <h3>{{ typedKey(key).body.data.title }}</h3>
                            </NuxtLink>
                            <p>{{ refs[0].wordaround }}</p>
                        </li>
                    </template>
                </ul>
            </template>
            <template #suspence><div>loading index...</div></template>
        </StaticSeek>
    </section>
</template>
```

The StaticSeek component handles index loading and search execution.
- The component is loaded lazily using `trigger` ref, ensuring that the search index is not loaded until the user types in the input field.
- The `query` v-model in the input element is passed to StaticSeek to perform searches.
- The `url` prop points to the pre-generated search index JSON file.
- The `suspense` slot defines the element displayed while the index is loading.
- The `default ` slot specifies a template that converts `SearchResult[]` into html elements. `SearchResult[]` is passed via `#default="{ results }"`

Important implementation details:
- Search results are sorted by relevance score.
- Each result includes:
  - The key fields specified during index creation (title and slug).
  - Matched content context via `refs[*].wordaround`.
  - A link to the full post using the slug.

### 3. Index Loading and Search Execution

The `StaticSeek` Vue component, provided by the npm package [staticseek-vue](https://github.com/osawa-naotaka/staticseek-vue), is responsible for loading the search index and executing queries. The complete implementation is shown below:

```vue
<script setup lang="tsx">
import type { SearchResult, StaticSeekIndex } from "staticseek";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";

interface Props {
    query: string,
    url: string,
}
const { query, url } = defineProps<Props>();

const index = ref<StaticSeekIndex>();
const loading = ref(true);
const results = ref<SearchResult[]>([]);

async function init() {
    const { data } = await useFetch<StaticSeekIndex>(url);
    if (!data.value) {
        throw new Error("Failed to fetch search index.");
    }
    const newIndex = createIndexFromObject(data.value);

    if (newIndex instanceof StaticSeekError) {
        throw newIndex;
    }

    index.value = newIndex;
    loading.value = false;
}

watch(() => query, async (q) => {
    if (!index.value) {
        results.value = [];
        return ;
    }
    const searchResults = await search(index.value, q);
    if (searchResults instanceof StaticSeekError) {
        console.error(searchResults);
        results.value = [];
        return;
    }

    results.value = searchResults;
});

init();
</script>

<template>
    <template v-if="loading">
        <slot name="suspence"></slot>
    </template>
    <template v-else>
        <slot name="default" :results="results"></slot>
    </template>
</template>
```

Key Implementation Details:
- The search index is loaded only once during component initialization asynchronusly in `async init()` calling without `await`.
- Since the search function is asynchronous, the watch dependency includes `() => query`, ensuring that a new search is executed whenever the query changes.
- The search results are passed to the render template with `results` prop.
