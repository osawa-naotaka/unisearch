[README.md in Japanese](https://github.com/osawa-naotaka/staticseek/blob/main/README.ja.md)

# staticseek: A Lightweight, Fast Full-text Search Engine for Static Sites

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
- Zero dependencies
- Seamless integration with popular Static Site Generators (SSG)

## Quick Start

First, install staticseek in your environment:

```shell
npm install staticseek
```

Next, import staticseek into your project and perform indexing and searching:

```javascript
import { LinearIndex, createIndex, search, StaticSeekError } from "staticseek";

// Create an index
const index = createIndex(LinearIndex, array_of_articles);
if(index instanceof StaticSeekError) throw index;

// Perform a search
const result = await search(index, "search word");
```

For WebGPU-accelerated searching:

```javascript
import { GPULinearIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(GPULinearIndex, array_of_articles);
if(index instanceof StaticSeekError) throw index;

const result = await search(index, "search word");
```

If you experience performance issues, try disabling fuzzy search.

```javascript
import { LinearIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(LinearIndex, array_of_articles, { distance: 0 });
if(index instanceof StaticSeekError) throw index;

const result = await search(index, "search word");
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

Search performance for a 4MB dataset (approximately 100 articles):

- Exact Match: < 5ms
- Fuzzy Search: < 150ms
- Index Generation: ~1sec
  - ~30sec for HybridTrieBigramInvertedIndex

For detailed benchmarks across different hardware configurations and index types, see the [Benchmarks section](#Benchmark) below.

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

## Limitations

- Index size roughly equals total text size
- WebGPU acceleration requires compatible hardware/browser
- Limited support for very large datasets (>10MB)

## Creating Search Indices

staticseek operates in two phases: index creation and search execution. The index is created once when the page loads and is reused for all subsequent searches.

### Basic Index Creation

```typescript
type Path = string;
type FieldName = string;

function createIndex(
    index_class: IndexClass,
    contents: unknown[],
    env: SearchEnv = {},
): StaticSeekIndex | StaticSeekError;

type SearchEnv = {
    field_names?: Record<FieldName, Path>;
    key_fields?: Path[];
    search_targets?: Path[];
    weight?: number;
    distance?: number;
};
```

#### Parameters

- `index_class`: Specifies the search algorithm implementation
  - `LinearIndex`: Standard implementation (default choice)
  - `GPULinearIndex`: WebGPU-accelerated implementation
  - `HybridTrieBigramInvertedIndex`: High-performance implementation for larger datasets

- `contents`: Array of JavaScript objects to be indexed
  - Supports string fields and string array fields
  - Nested arrays containing strings are excluded from search
  
- `env`: Configuration options for indexing and searching (optional)
  - `field_names`: Custom field mapping for search queries (e.g., `{ link: "slug" }`)
  - `key_fields`: Fields to include in search results
  - `search_targets`: Fields to index for searching
  - `weight`: Default weight for scoring
  - `distance`: Default edit distance for fuzzy search

The function returns either a `StaticSeekIndex` object or `StaticSeekError` if validation fails.

### Configuring Search Results

When creating an index, you can specify which fields should be included in search results. Here's an example data structure:

```javascript
const array_of_articles = [
    {
      slug: "introduction-to-js",
      content: "JavaScript is a versatile programming language widely used for web development. It enables interactive features on websites, such as dynamic updates, animations, and form validation. JavaScript is essential for creating modern web applications and supports various frameworks like React and Vue.js.",
      data: {
        title: "Introduction to JavaScript",
        description: "Learn the basics of JavaScript, a powerful language for modern web applications.",
        tags: ["javascript", "web", "programming"]
      }
    },
    // ...
];
```

To include specific fields in search results, use the `key_fields` option:

```javascript
const index = createIndex(LinearIndex, array_of_articles, {
    key_fields: ['slug', 'data.title']
});
```

### Controlling Index Size

#### Field Selection
You can limit which fields are indexed using the `search_targets` option:

```javascript
const index = createIndex(LinearIndex, array_of_articles, {
    search_targets: ['data.title', 'data.description', 'data.tags']
});
```

#### Storage Considerations
- Index size approximately equals the total text size
- HTTP compression (gzip) helps reduce transfer size
- For indices > 1MB, consider:
  - Using Local Storage
  - Dynamic loading via fetch

### Static Site Generator Integration

For static sites, you can pre-generate indices during build time to optimize page load performance:

1. Convert index to a serializable object:
```javascript
function indexToObject(index: StaticSeekIndex): StaticSeekIndexObject

const index = createIndex(LinearIndex, array_of_articles);
if(index instanceof StaticSeekError) throw index;
const json = JSON.stringify(indexToObject(index));
```

2. Load and reconstruct index on the client:
```javascript
function createIndexFromObject(index: StaticSeekIndexObject): StaticSeekIndex | StaticSeekError;

const resp = await fetch(index_url);
const re_index = createIndexFromObject(resp.json());
if(re_index instanceof StaticSeekError) throw re_index;
const result = await search(re_index, "search word");
```

## Performing Searches

Once an index is created, you can perform multiple searches using the same index:

```typescript
async function search(index: StaticSeekIndex, query: string): Promise<SearchResult[] | StaticSeekError>
```

### Query Syntax

#### Fuzzy Search
By default, staticseek performs fuzzy search with an edit distance of 1,
meaning it tolerates one character error per search term. You can adjust this tolerance in two ways:

For individual searches, specify the edit distance in the query:
```
distance:2 searchterm    // Allows up to 2 character differences
```

Spaces between "distance:" and "2" is not allowed.

To set a different default edit distance for all searches, configure it during index creation:
```javascript
const index = createIndex(LinearIndex, array_of_articles, {
    distance: 2  // Set default edit distance for all searches
});
```

If you set the edit distance to 0, fuzzy serch is disabled and exact match is performed instead.

#### Exact Match Search
Use double quotes for exact phrase matching:
```
"exact phrase"    // Matches the exact phrase including spaces
```
Use `\"` to include double quotes in the search term.

#### Boolean Operations
- **AND Search**: Space-separated terms (both terms must match)
  ```
  term1 term2    // Documents containing both terms
  ```

- **OR Search**: Terms separated by OR (either term can match)
  ```
  term1 OR term2    // Documents containing either term
  ```

- **NOT Search**: Terms prefixed with minus (exclude documents with term)
  ```
  -term1 term2    // Documents with term2 but without term1
  ```
  Note: NOT search must be used with AND search; standalone NOT terms are ignored.

#### Field-Specific Search
Limit search to specific fields:
```
from:title searchterm    // Search only in title field
```

Configure custom field names during index creation:
```javascript
const index = createIndex(LinearIndex, array_of_articles, {
    field_names: { link: "slug" }  // Allow "from:link" to search slug field
});
```

#### Score Weighting
Adjust relevance scoring for specific terms:
```
from:title weight:2.5 searchterm    // Increase title matches' weight by 2.5x
```

### Search Results

Search results are returned as an array of `SearchResult` objects:

```typescript
export type SearchResult = {
    id: number;
    key: Record<string, unknown>;
    score: number;
    refs: Reference[];
};
```

- **id**: The index position of the matching document in the original array.
- **key**: An object containing the specified fields from the original document. For example, if `['slug', 'data.title']` were set as `key_fields`, the result would include `{ slug: "matching slug", data: { title: "matching title" } }`.
- **score**: A TF-IDF-based relevance score, where higher scores indicate stronger matches. Scores decrease proportionally to edit distance in fuzzy searches.
- **refs**: An array of `Reference` objects containing details on the match locations.

```typescript
export type Reference = {
    token: string;
    path: Path;
    pos?: number;
    wordaround?: string;
    distance: number;
};
```

- **token**: The specific search term that matched.
- **path**: The field where the match was found.
- **pos**: The position of the match within the text (character index from the beginning of the field). For fuzzy matches, slight shifts may occur due to insertions/deletions.
- **wordaround**: A snippet of text surrounding the match for better context.
- **distance**: The edit distance for fuzzy search matches.

### Important Notes

- **Version Compatibility**: Ensure matching staticseek versions between index generation and usage
- **Performance**: Index generation takes ~1s for 100 articles (~4MB of text), or 10-30s for `HybridTrieBigramInvertedIndex`
- **Security**: Avoid including sensitive information (personal names, addresses) in indexed content
- **Optimization**: Pre-generating indices with SSG reduces client-side processing and improves load times
- **Unicode Support**: All whitespace types (full-width, half-width, tabs, newlines, and others) are supported in queries


## Creating an Index for Faster Search

The full-text search functionality provided by `LinearIndex` is sufficient for most static site use cases. However, if you require even faster search performance, alternative indexing methods can be utilized to optimize speed and efficiency.

### GPU Linear Index

```javascript
import { GPULinearIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(GPULinearIndex, array_of_articles);
```

By leveraging `GPULinearIndex`, fuzzy searches can be offloaded to the GPU, significantly improving performance. This method can achieve several times the speed of `LinearIndex`. The usage remains identical to `LinearIndex`, making it easy to switch between implementations.

If a GPU is not available in the execution environment, `GPULinearIndex` will automatically fall back to `LinearIndex`, ensuring compatibility across different devices.

### Hybrid Trie Bigram Inverted Index

```javascript
import { HybridTrieBigramInvertedIndex, createIndex, search, StaticSeekError } from "staticseek";

const index = createIndex(HybridTrieBigramInvertedIndex, array_of_articles);
```

The `HybridTrieBigramInvertedIndex` offers an 10x - 100x search speed improvement compared to `LinearIndex`. The API usage remains the same, making integration seamless.

However, this increased speed comes at a cost, introducing several trade-offs:

1. **Longer Indexing Time**: Index creation is significantly slower, taking approximately 10-30 seconds for 100 articles. It is essential to generate the index in advance, such as during a static site generation (SSG) build process.
2. **Higher Search Noise for CJK Language**: False positives (irrelevant results appearing in search results) become more frequent in languages such as Chinese, Japanese, and Korean(CJK).
3. **Reduced Accuracy for CJK Languages**: Fuzzy searches in CJK may produce noisier results, matching unintended terms.
4. **Limited Result Metadata**: Some search result details, such as exact match position (`pos`) and surrounding text (`wordaround`), are unavailable.
5. **Incomplete TF-IDF Scoring**: Currently, only term frequency (TF) is calculated, leading to less refined ranking.

Despite these drawbacks, `HybridTrieBigramInvertedIndex` ensures fast search performance across all devices, delivering a smooth user experience. If prioritizing responsiveness is critical, this index type is a good choice.

## Benchmark

### Benchmark on Intel Core i5 13400F and NVIDIA GeForce RTX 4070

The following benchmarks were conducted using an **Intel Core i5 13400F** and **NVIDIA GeForce RTX 4070**. The index size is represented in kilobytes, while all other metrics are measured in milliseconds (ms).


#### **Exact Search Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 0.44 | 0.42 | 0.08 |
| 829 | 0.63 | 0.62 | 0.11 |
| 1712 | 1.25 | 1.27 | 0.16 |
| 3001 | 2.10 | 2.12 | 0.14 |
| 3748 | 2.65 | 2.63 | 0.11 |

---

#### **Fuzzy Search Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 10.78 | 5.04 | 0.24 |
| 829 | 16.40 | 5.23 | 0.26 |
| 1712 | 33.56 | 5.71 | 0.33 |
| 3001 | 58.54 | 6.46 | 0.39 |
| 3748 | 73.60 | 7.16 | 0.41 |

---

#### **Fuzzy Search Time (ms) (Japanese)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 476 | 3.27 | 4.20 | 0.13 |
| 789 | 4.96 | 4.30 | 0.13 |
| 1305 | 8.40 | 4.83 | 0.15 |
| 2394 | 15.21 | 5.07 | 0.19 |
| 3020 | 19.39 | 5.37 | 0.24 |

---

#### **Indexing Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 45.10 | 42.38 | 1,764 |
| 829 | 73.20 | 63.50 | 2,733 |
| 1712 | 133.00 | 133.36 | 5,727 |
| 3001 | 237.86 | 225.22 | 10,332 |
| 3748 | 285.94 | 286.18 | 13,038 |

---

#### **Index Size (Gzipped, kbyte) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 191 | 191 | 91 |
| 829 | 294 | 294 | 131 |
| 1712 | 607 | 607 | 247 |
| 3001 | 1057 | 1057 | 411 |
| 3748 | 1324 | 1324 | 505 |

---

#### **Index Size (Gzipped, kbyte) (Japanese)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 476 | 165 | 165 | 136 |
| 789 | 272 | 272 | 229 |
| 1305 | 452 | 452 | 366 |
| 2394 | 837 | 837 | 644 |
| 3020 | 1053 | 1053 | 813 |

### Benchmark on Intel N100

A second benchmark was conducted using an **Intel N100** CPU to evaluate performance on lower-power devices.

#### **Exact Search Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 1.09 | 1.16 | 0.34 |
| 829 | 1.45 | 1.55 | 0.49 |
| 1712 | 2.64 | 2.64 | 0.32 |
| 3001 | 3.99 | 4.27 | 0.41 |
| 3748 | 5.31 | 5.32 | 0.45 |

---

#### **Fuzzy Search Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 21.27 | 8.50 | 0.28 |
| 829 | 32.17 | 10.48 | 0.36 |
| 1712 | 64.99 | 14.93 | 0.32 |
| 3001 | 113.41 | 21.89 | 0.43 |
| 3748 | 140.33 | 25.98 | 0.68 |

---

#### **Fuzzy Search Time (ms) (Japanese)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 476 | 6.63 | 5.66 | 0.27 |
| 789 | 10.76 | 6.88 | 0.27 |
| 1305 | 17.75 | 6.94 | 0.29 |
| 2394 | 31.11 | 8.06 | 0.38 |
| 3020 | 39.35 | 9.12 | 0.61 |

---

#### **Indexing Time (ms) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 121.82 | 122.58 | 4422 |
| 829 | 191.94 | 191.46 | 6707 |
| 1712 | 403.90 | 377.72 | 14501 |
| 3001 | 709.00 | 715.72 | 25726 |
| 3748 | 912.72 | 861.46 | 32124 |

---

#### **Index Size (Gzipped, kbyte) (English)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 538 | 191 | 191 | 91 |
| 829 | 294 | 294 | 131 |
| 1712 | 607 | 607 | 247 |
| 3001 | 1057 | 1057 | 411 |
| 3748 | 1324 | 1324 | 505 |

---

#### **Index Size (Gzipped, kbyte) (Japanese)**
| Text Size | Linear | GPU | Inverted |
|-----------|--------|-----|----------|
| 476 | 165 | 165 | 136 |
| 789 | 272 | 272 | 229 |
| 1305 | 452 | 452 | 366 |
| 2394 | 837 | 837 | 644 |
| 3020 | 1053 | 1053 | 813 |

These benchmarks illustrate the performance trade-offs among the different index types. While `HybridTrieBigramInvertedIndex` is faster, it comes at the cost of higher indexing time and reduced search accuracy. Meanwhile, `GPULinearIndex` provides a substantial speed boost while maintaining accuracy, making it a viable option for environments with GPU support.

For optimal performance, select the index type that best fits your application’s needs.


## Introduction to Search Algorithms

### LinearIndex

The `LinearIndex` utilizes a straightforward exact match search algorithm. Rather than implementing a custom search mechanism, it simply leverages JavaScript’s built-in `String.prototype.indexOf()`. Due to optimizations in JavaScript engines like V8, this approach achieves high-speed performance even for full-text searches. However, as the number of documents grows, performance may degrade. At such a scale, the index size can reach tens of megabytes, making full-text search on a static site impractical.

For fuzzy search, the `bitap` algorithm is employed, which runs approximately 50 times slower than `indexOf()`. An attempt was made to implement `bitap` in Rust-WASM, but the performance was significantly slower than the JavaScript version, leading to its exclusion. The search process segments characters into graphemes using `Intl.Segmenter()`, ensuring correct edit distance calculations even for complex characters like kanji variants, emojis, and national flags. However, due to the need to maintain a separate index for grapheme units, memory usage is effectively doubled.

### GPULinearIndex

The `GPULinearIndex` follows the same exact match search approach as `LinearIndex`. For fuzzy search queries exceeding 32 characters, it also defaults to the `LinearIndex` method. However, for shorter fuzzy searches, `GPULinearIndex` accelerates processing by running the `bitap` algorithm on the GPU. Each character position in the index spawns a parallel search thread, executing a `bitap`-based search across the query length. This implementation leverages WebGPU and executes in `wgsl`.

### HybridTrieBigramInvertedIndex

The `HybridTrieBigramInvertedIndex` categorizes characters into two groups: languages such as Japanese, where word boundaries are difficult to define, and languages like English, where words are naturally separated by spaces. Different indexing strategies are applied to each category. For English, a word-based inverted index with Trie data structiure is used, while for Japanese and similar languages, a bigram-based inverted index is created by fragmenting sentences without explicit word segmentation.

Although increasing the n-gram size (e.g., using trigrams) could reduce search noise, it would also inflate the index size. A balance between accuracy and efficiency was sought, leading to the adoption of bigrams.

### Preprocessing

The preprocessing pipeline applies minimal transformations:
- **Unicode normalization (NFKC)**
- **Lowercasing for case-insensitive matching**
- **Basic normalization for Japanese text**

For inverted indexes, stopwords and stemming are not utilized to maintain neutrality across languages. Additionally, for graphemes composed of multiple code points (e.g., emojis), only the first code point is extracted for indexing.

For `HybridTrieBigramInvertedIndex`, additional preprocessing steps are performed:
- Symbols and punctuation are removed and used as delimiters
- Tokenization by whitespace
- Classification of languages that hard to segment into words (e.g., Japanese) versus those that do not (e.g., English)

As a result, standalone symbols cannot be searched, and URLs are tokenized into components. Ideally, a universal language-agnostic tokenization mechanism would be available, but existing solutions remain incomplete. `Intl.Segmenter()` provides partial support for languages like Japanese and Chinese, and future improvements are anticipated.

### Alternative Algorithms Considered

Several alternative algorithms were explored but ultimately discarded due to inefficiencies:

1. **Bloom Filters**
   - Although effective in reducing false negatives, Bloom filters increased posting list sizes proportional to the number of hash functions used.
   - Even with an optimal configuration of 2-3 hash functions, the resulting index size became impractical.

2. **LSH, MinHash, and Sentence Embeddings**
   - While these approaches hold potential for semantic search, they proved unsuitable for full-text search with fuzzy matching.
   - Misspelled words would effectively introduce new dictionary entries, increasing dimensional complexity and making distance calculations unreliable.
   - Even with dimensionality reduction techniques, vectorized representations failed to accurately capture fuzzy text similarities.

Although semantic search remains a compelling direction, its implementation requires server-side infrastructure, making it unsuitable for a fully client-side static site search engine. Future iterations may explore this capability in greater depth.

