# staticseek: A Lightweight, Fast Full-text Search Engine Supporting All Unicode Languages

For detailed instructions on how to use staticseek, please visit the [official website](https://staticseek.lulliecat.com/).

## Overview
staticseek is a client-side full-text search engine designed specifically for static websites. It enables searching through arrays of JavaScript objects containing strings or string arrays. By converting your articles into JavaScript objects, you can implement full-text search functionality on static sites without any server-side implementation.

## Key Features
- Simple and intuitive API
- Support for fuzzy search with customizable edit distance
- Advanced search operations (AND, OR, NOT)
- Field-specific search capabilities
- TF-IDF based scoring with customizable weights
- Google-like query syntax
- Unicode support for all languages including CJK characters and emojis
- Multiple index implementations for different performance needs
- Seamless integration with popular Static Site Generators (SSG)

## Quick Start

First, install staticseek in your environment:

```shell
npm install staticseek
```

Alternatively, you can directly import staticseek using [jsDelivr's CDN service](https://www.jsdelivr.com/package/npm/staticseek).

Next, import staticseek into your project and perform indexing and searching.
Here, `array_of_articles` represents an array of JavaScript objects containing the text to be searched.

```javascript
import { LinearIndex, createIndex, search, StaticSeekError } from "staticseek";

// Create an index
const index = createIndex(LinearIndex, array_of_articles);
if(index instanceof StaticSeekError) throw index;

// Perform a search
const result = await search(index, "search word");
if(result instanceof StaticSeekError) throw result;
for(const r of result) {
  console.log(array_of_articles[r.id]);
}
```

The search results are returned as an array, sorted by score (relevance). The id field in each result contains the array index of the matching document.

To accelerate searches using WebGPU, use the following code. The usage after index creation remains the same as above.

```javascript
import { GPULinearIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(GPULinearIndex, array_of_articles);
...
```

If you experience performance issues, try using speed-optimized index.

```javascript
import { HybridTrieBigramInvertedIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(HybridTrieBigramInvertedIndex, array_of_articles);
...
```

## Search Features

### Query Syntax
- **Fuzzy Search**: Default behavior with configurable edit distance
  - `distance:2 searchterm` - allows 2 character edits
- **Exact Match**: `"exact phrase"`
- **AND Search**: `term1 term2`
- **OR Search**: `term1 OR term2`
- **NOT Search**: `-term1 term2`
- **Field-Specific**: `from:title searchterm`
- **Custom Weights**: `from:title weight:2.5 searchterm`

### Index Types

1. **LinearIndex** (Default)
   - Best for small to medium-sized content
   - Simple and reliable
   - Good balance of performance and accuracy

2. **GPULinearIndex**
   - WebGPU-accelerated fuzzy search
   - 2-10x faster for larger datasets
   - Gracefully falls back to LinearIndex when WebGPU is unavailable

3. **HybridTrieBigramInvertedIndex**
   - ~100x faster search performance
   - Ideal for larger datasets
   - Trade-offs:
     - Slower index generation
     - Higher false positive rate for CJK-like languages
     - Less precise fuzzy search for CJK-like languages
     - Limited result metadata

## Performance

By selecting the appropriate index type, typical search times can be kept within a few milliseconds.
Search performance for a 4MB dataset (worst case scenario, slowest index type, approximately 100 articles):

- Exact Match: < 5ms
- Fuzzy Search: < 150ms
- Index Generation: ~1sec
  - ~30sec for HybridTrieBigramInvertedIndex

For detailed benchmarks across different hardware configurations and index types, see the [Benchmarks section](https://staticseek.lulliecat.com/benchmark/13400f-rtx4070/) of official website.

## Integration with Static Site Generators

Example implementations are available for:
- Next.js
  - [Basic Example](https://github.com/osawa-naotaka/staticseek/tree/main/example/next/01.basic)
  - [Preindexed on-demand loading](https://github.com/osawa-naotaka/staticseek/tree/main/example/next/02.preindexed)
- Astro
  - [Basic Example](https://github.com/osawa-naotaka/staticseek/tree/main/example/astro/01.basic)
  - [Preindexed on-demand loading](https://github.com/osawa-naotaka/staticseek/tree/main/example/astro/02.preindexed)
- Nuxt
  - [Basic Example](https://github.com/osawa-naotaka/staticseek/tree/main/example/nuxt/01.basic)
  - [Preindexed on-demand loading](https://github.com/osawa-naotaka/staticseek/tree/main/example/nuxt/02.preindexed)
