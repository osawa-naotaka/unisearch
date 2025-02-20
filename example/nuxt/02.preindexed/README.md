# staticseek Example (Nuxt)

Experience this implementation in action at [staticseek-nuxt.pages.dev](https://staticseek-nuxt.pages.dev/).

## Getting Started

To launch the development server locally, execute these commands:

```bash
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Deployment

This example is optimized for static hosting platforms. To generate and deploy the static files:

```bash
npm install
npm run generate
# Deploy the generated ".output/public" directory to your HTTP server
```

## Integration Guide: StaticSeek with Nuxt

### 0. Creating the Post Index Page

Nuxt generates static HTML files by traversing links from the root (`/`) page. Therefore, all posts must be accessible from the root. In this implementation, the `/posts` page serves as an index containing links to all individual posts.

### 1. Creating the Search Index

Begin by creating a static index file. Here's how to implement this at `server/routes/searchindex.json.ts`:

```typescript
import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";
import matter from "gray-matter";

export default defineEventHandler(async (event) => {
    const raw_posts = await queryCollection(event, "posts").all();
    const posts = raw_posts.map((post) => ({ path: post.path, body: matter(post.rawbody.replaceAll("\\n", "\n")) }));

    const index = createIndex(GPULinearIndex, posts, { 
        key_fields: ["path", "body.data.title"], 
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

To use `rawbody` of the posts, configure schema in `content.config.ts`:

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

To generate `searchindex.json` staticaly, configure `nitro` in `nuxt.config.ts`:

```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ["/searchindex.json"],
    },
  },
})
```

Essential configuration points:
- Utilize `GPULinearIndex` for search functionality (alternative index types are available)
- Retrieve posts using Nuxt Content's `queryCollection` function
- Define collection directory and schema in `content.config.ts`
- Specify `key_fields` to determine which fields are available in search results (path and title in this example)
- Configure `search_targets` to define searchable fields (content and title in this example)
- Convert the index to JSON using `indexToObject` before serving

### 2. Implementing the Search Interface

Create a search interface page (e.g., in `pages/index.vue`).

```vue
<script setup lang="ts">
import { createSearchFn, StaticSeekError } from "staticseek";
import type { SearchResult } from "staticseek";
import * as v from "valibot";

const schema = v.object({
    path: v.string(),
    body: v.object({
        data: v.object({
            title: v.string(),
        }),
    }),
});

const search_fn = createSearchFn("/searchindex.json", (x) => { loading.value = x });
const loading   = ref(false);
const results   = ref<SearchResult[]>([]);
const query     = ref("");

async function onInputQuery(e: Event) {
    if(e.target instanceof HTMLInputElement) {
        const r = await search_fn(e.target.value);
        if(!(r instanceof StaticSeekError)) {
            results.value = r;
        }
    }
}
</script>

<template>
    <section>
        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" v-model="query" @input="onInputQuery"/>
        </div>
        <div v-if="loading">
            Loading index...
        </div>
        <template v-else>
            <h2>results</h2>
            <ul class="search-results">
                <li v-if="results.length === 0 && query.length !== 0">No results found.</li>
                <template v-else>
                    <li v-for="{refs, key} in results" :key="v.parse(schema, key).path">
                        <NuxtLink :to="v.parse(schema, key).path" >
                            <h3>{{ v.parse(schema, key).body.data.title }}</h3>
                        </NuxtLink>
                        <p>{{ refs[0].wordaround }}</p>
                    </li>
                </template>
            </ul>
        </template>
    </section>
</template>
```

Key features:
- Create search function once during component initialization.
- Index is loaded at the first call of `search_fn` to prevent unused fetch of index.
- Index loading state `loading` is triggered by callback function given to the `createSearchFn`.
- Results are automatically sorted by relevance score
- Each result entry contains:
  - Key fields specified during index creation (`title` and `path`)
  - Contextual content matches via `refs[*].wordaround`
  - Direct links to full posts using the `path` property
