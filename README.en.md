# unisearch.js: Lightweight and reasonably fast full-text search engine for static sites
## Overview
unisearch.js is a complete client-side full-text search engine designed for static sites. It can search for strings and arrays of strings in any JavaScript object array. Full-text search functionality can be realized on a static site without any server-side implementation.

unisearch.js is very easy to use. The code required for searching is shown below. Only a few lines of code are required.

```
import { LinearIndex, createIndex, search, UniSearchError } from "unisearch.js";

const index = createIndex(LinearIndex, array_of_articles);

if(index instanceof UniSearchError) throw index;
const result = await search(index, "search word");
```

If you want to use WebGPU for searching, use GPULinearIndex instead of LinearIndex.

```
import { GPULinearIndex, createIndex, search, UniSearchError } from "unisearch.js";

const index = createIndex(GPULinearIndex, array_of_articles);
...
```

unisearch.js provides a complete set of search functions. In addition to exact match search, it also provides a fuzzy search function. In addition, there are and, or, not, and field-specific searches, as well as the ability to specify scoring weights. Search results are sorted based on a scoring method called TF-IDF, along with strings around the match.

unisearch.js is reasonably fast: an exact match search for about 100 Wikipedia articles with a total size of about 3 Mbytes takes less than 1 msec, and a fuzzy search takes less than 50 msec. By changing the indexing scheme, the search speed can be further improved and more articles can be included in the search.

unisearch.js can search for all languages that can be represented by unicode. General normalization, Japanese-specific normalization, and grapheme-by-grapheme searches ensure correct searches for Kanji variants and pictographs.

unisearch.js does not depend on any other JavaScript libraries and can be easily embedded in your site.

unisearch.js can be used in conjunction with SSG such as Next.js and Astro.js to create an index in advance and load the index at search start time. These samples are also registered in the repository. Please feel free to use them.

- [React and Next.js](https://github.com/osawa-naotaka/unisearch/tree/main/example/react-next)
- [Astro.js](https://github.com/osawa-naotaka/unisearch/tree/main/example/astro)


## Usage

unisearch.js performs search by following two steps: index creation and search using the index. The index is created only once when the page is loaded, and the index is used for each search.

### Index Creation
The type of function to create an index is shown below.

```
export function createIndex(
    index_class: IndexClass,
    contents: unknown[],
    env: SearchEnv = {},
): UniSearchIndex | UniSearchError;

export type SearchEnv = {
    field_names?: Record<FieldName, Path>;
    key_fields?: Path[];
    search_targets?: Path[];
    weight?: number;
    distance?: number;
};
```

index_class specifies the algorithm to be used for full-text search by class. Usually, the LinearIndex class is specified. If you want to use WebGPU for searching, use GPULinearIndex instead of LinearIndex. contents specifies an array of JavaScript objects to be searched. The search is limited to the fields of this object that are either strings or arrays of strings. If there is an array field in between up to the string field, it is not included in the search even if the field is a string. env specifies default options for indexing and searching.

The return value of the function is the index created. The return value of createIndex is UniSearchIndex | UniSearchError. If there is a problem with the specified contents or env, UniSearchError is returned. 

The result of the search is obtained as an array of ids. Additional infomation belonging to the search object can also be returned as search results. For example, you can set the slug of an article to make it easier to use the search results.

To include an arbitrary field in the search results, specify a key_fields field in the env argument of the createIndex function, where the key_fields field is array of the path from the root of the object to the key field as a string separated by a dot. The following is an example of specifying slug and title as key fields in the following object configuration.

```
export const array_of_articles = [
    {
      slug: "introduction-to-js",
      content: "JavaScript is a versatile programming language widely used for web development. It enables interactive features on websites, such as dynamic updates, animations, and form validation. JavaScript is essential for creating modern web applications and supports various frameworks like React and Vue.js.",
      data: {
        title: "Introduction to JavaScript",
        description: "Learn the basics of JavaScript, a powerful language for modern web applications.",
        tags: ["javascript", "web", "programming"]
      }
    },
    ...
];
```

```
const index = createIndex(LinearIndex, array_of_articles, {key_fields: ['slug', 'data.title']});
```

The index contains all text fields of a given standard object as is. The index size is roughly equal to the total size of the text to be searched. http protocol will probably use gzip compression, but if the total text size still exceeds 10Mbytes, it may be necessary to use Local Storage to store the index. It is also necessary to separate the index as a json file and dynamically fetch it at search time.

Also, as mentioned above, since the index contains all sentences, be very careful not to include sensitive information such as real names and addresses in the search.

You can also limit the fields to be included in the index. The specification should be given as an array in the search_targets field of the env argument.

```
const index = createIndex(LinearIndex, array_of_articles, {search_targets: ['data.title','data.description','data.tags']});
```

Indexes can also be created in advance to reduce the amount of processing required when loading pages. When using a static site generator (SSG), indexes can be created at deployment time and placed as json files so that the indexes can be loaded from the client side using fetch, reducing the size of bundles in html files and reducing loading time when no search is performed. 

To convert an index into a JavaScript object, use the indexToObject function.

```
export function indexToObject(index: UniSearchIndex): UniSearchIndexObject
```

```
const index = createIndex(LinearIndex, array_of_articles);

if(index instanceof UniSearchError) throw index;

const json = JSON.stringify(indexToObject(index));
```

Also, to reconstruct an index from a JavaScript object, use the createIndexFromObject function.

```
export function createIndexFromObject(index: UniSearchIndexObject): UniSearchIndex | UniSearchError;
```

```
const resp = await fetch(index_url);
const re_index = createIndexFromObject(resp.json());

if(re_index instanceof UniSearchError) throw re_index;

const result = await search(re_index, "search word");
```

If the versions of the indexes do not match, an error will occur. In this case, please re-generate the index by matching the version of unisearch.js.

Index generation takes some time: for about 100 articles, or 3 MByte of full text, it takes about 500 msec.

### Searching using an index
Once an index has been created, searches can be performed many times using the same index.

```
export async function search(index: UniSearchIndex, query: string): Promise<SearchResult[] | UniSearchError>
```

The query is given to the search function as a string with an index. The format of the query is generally similar to that of a Google search.

- fuzzy search

unisearch.js performs fuzzy search by default. By default, fuzzy search allows up to one character error (edit distance). To increase the number of characters, precede the search string with a positive integer indicating the number of allowed mistakes, e.g., “distance:2 search string. The same format is used below to specify options for the search string.

To set the edit distance uniformly, rather than setting it every time, set the edit distance to be specified in the distance field of the env argument when creating the index. You can also disable fuzzy search by setting the edit distance to 0.

```
const index = createIndex(LinearIndex, array_of_articles, {distance: 2});
```

- Exact Match Search

To perform an exact match search, enclose the search string in double quotation marks, such as "search string". If a space is included within the double quotation marks, an exact match search is performed including the space. The inside of a double quotation mark accepts an escape sequence. To add a double quotation mark itself to the search string, type \".

- and search

Searches for sentences containing both strings by separating the search string with a space, as in "search-string-1 search-string-2". Whitespace corresponds to all spaces in unicode, including full-width spaces, half-width spaces, tabs, and line feeds.

- not search

By prefixing the search word with a minus sign, such as -search-string-1 search-string-2 or -"search-string-1" search-string-2, you can search for sentences that do not contain that string. In this example, the search will find sentences that do not contain search-string-1, but contain search-string-2. not search is always used with and search; if not search is used by itself, the search word will be ignored.

- or search

Searches for sentences containing either or both of search-string-1 and search-string-2 by separating the search strings with a space-separated capital OR, as in search-string-1 OR search-string-2. The strength of the combination is stronger for and than for or. For example, search-string-1 search-string-2 OR search-string-3 will search for sentences that contain both search-string-1 and search-string-2, or search-string-3.


- Search field limitation

You can limit the search to only a portion of the indexed sentences instead of all of them. For example, to include only the slug field in the previous example, enter from:slug search-string. The field specification immediately after “from:” points to the end of the path string to the field by default. For example, to specify data.title, enter from:title search-string.

The field specification string can be customized when creating the index. For example, to allow slug to be searched with the specification from:link, set the argument env field_names.

```
const index = createIndex(LinearIndex, array_of_articles, { field_names: { link: "slug" } });
```

- Changing the score weight

For example, “from:title weight:2.5 search-string” will search for a search string in the title field and multiply its score by 2.5. A positive integer or floating-point number can be specified immediately after weight:. The score of the sentence corresponding to the specified keyword is multiplied by 2.5.


### Search Results
Search results are returned as an array of SearchResult type.

```
export type SearchResult = {
    id: number;
    key: string | null;
    score: number;
    refs: Reference[];
};
```

The id field returns the array index of the matched sentences. The key field is set to the field specified during indexing. The score is set to a value based on the TF-IDF, which is the sum of the TF-IDFs of the individual search words, multiplied by 1/x for additional edit distance value x.

The refs field is set to an array of information about the matches in the search.

```
export type Reference = {
    token: string;
    path: Path;
    pos?: number;
    wordaround?: string;
    distance: number;
};
```

The token is set to the individual search string in the query. path is the path to the field from which the search term was found. pos is the number of characters from the beginning of the sentence to the point where the match was found. During fuzzy search, the pos position may shift a little depending on the state of insertion or deletion. The wordaround is the characters before and after the match. distance is the edit distance for a fuzzy match.

## Create index for fast search

Full-text search based on the LinearIndex described above will provide sufficient performance for most use cases, assuming it is used for static sites.
However, if a faster search is needed, a different index format can be used to speed up the search.

### GPU Linear Index
```
import { GPULinearIndex, createIndex, search, UniSearchError } from "unisearch.js";

const index = createIndex(GPULinearIndex, array_of_articles);
```

By using GPULinearIndex, fuzzy search is performed on the GPU. It can be approximately several times faster. The usage of the search is exactly the same as with LinearIndex.
In environments where GPUs are not available, LinearIndex is automatically used instead.

### Hybrid Bigram Inverted Index
```
import { HybridBigramInvertedIndex, createIndex, search, UniSearchError } from "unisearch.js";

const index = createIndex(HybridBigramInvertedIndex, array_of_articles);
```

Using HybridBigramInvertedIndex improves the search speed by a factor of approximately 10-100. The usage of the search is exactly the same as with LinearIndex.

However, in exchange for the improved search speed, there are a number of drawbacks

1. Indexing takes a long time, about 3-6 seconds for 100 articles. Therefore, it is essential to create the index in advance with SSG, etc. 
2. Search noise increases, and false positives (sentences that should not match appear in the search results) increase.
3. fuzzy searches for CJK(Chinese, Japanese, Korean)-like languages will increase the noise considerably. It also matches strings that are farther away from the intended edit distance. 
4. Some of the information in the search results will be missing: pos and wordaround will not exist.
5. Scoring based on TF-IDF is incomplete. Only simple TFs are calculated now.

Overall, HybridBigramInvertedIndex is not really worth using. Consider using it only if you really need a fast search.

## Benchmark

Benchmarks using Intel Core i5 13400F + NVIDIA GeForce RTX 4070 are shown below, where index size is in bytes and other fields are in msec.

### Exact Match Search
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 0.1084 | 0.1146 | 0.0784   |
| 789021     | 0.1498 | 0.1548 | 0.0824   |
| 1305328    | 0.2194 | 0.2264 | 0.0958   |
| 2394217    | 0.3442 | 0.3618 | 0.1254   |
| 3020497    | 0.4134 | 0.435  | 0.0984   |

### Fuzzy Search
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 2.7128 | 4.594 | 0.1128   |
| 789021     | 4.5344 | 5.684 | 0.1182   |
| 1305328    | 7.4618 | 7.0552 | 0.1472   |
| 2394217    | 13.6572  | 8.6452   | 0.1968   |
| 3020497    | 17.2486  | 9.038    | 0.226    |

### Index Creation
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 20.04  | 20.04 | 373.48   |
| 789021     | 30.36  | 36.04 | 626.14   |
| 1305328    | 72.3   | 60.86 | 1009.88  |
| 2394217    | 123.36 | 126.12 | 1782.74  |
| 3020497    | 158.4  | 159.84 | 2361.58  |

Similarly, the benchmark using Intel N100 is shown below.

### Exact Match Search
| index size |	Linear|	GPU	| Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 0.2984 | 0.405 | 0.2912   |
| 789021     | 0.4336 | 0.5104 | 0.3136   |
| 1305328    | 0.6962 | 0.5976 | 0.4366   |
| 2394217    | 0.955  | 0.9446 | 0.3536   |
| 3020497    | 1.0758 | 1.0874 | 0.4388   |

### Fuzzy Search
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 6.5576 | 8.6892 | 0.3864   |
| 789021     | 11.3006 | 9.6058 | 0.413    |
| 1305328    | 17.8096 | 13.2846 | 0.6518   |
| 2394217    | 31.8176 | 18.4438 | 0.7692   |
| 3020497    | 40.6314 | 22.5536 | 1.0842   |

### Index Creation
| index size | Linear | GPU | Inverted |
| ---------- | ------ | --- | -------- |
| 475576     | 62.5   | 63.98 | 1076.14  |
| 789021     | 108.82 | 131.28 | 1725.02 |
| 1305328    | 189.16 | 203.3 | 2809.88 |
| 2394217    | 332    | 333.74 | 5114.64 |
| 3020497    | 433.86 | 426.08 | 6377.6  |


## Introduction of search algorithm

### LinearIndex

When using LinearIndex, the exact match search algorithm is very simple. Or rather, it just uses JavaScript's built-in String.prototype.indexOf(). It is probably optimized on the side of engines such as V8, and runs very fast for a full-text search in a straightforward manner. As expected, the speed becomes unsatisfactory when the number of articles increases to 10,000 or so, but in that case, the index size should be in the unit of 100 MByte, which is quite unrealistic for a full-text search target for a static site.

The fuzzy search uses the bitap algorithm, which is 50 times slower than indexOf. I tried to realize bitap in Rust-WASM, but the speed was much slower than that of JavaScript, so I did not adopt it. The characters to be searched are segmented into grapheme units using Intl.Segmenter(). Therefore, edit distances can be calculated correctly even for characters consisting of multiple code points, such as Kanji variants, pictographs, national flags, and so on. However, the memory usage is doubled because the index of each grapheme unit is generated separately from the index of an ordinary string.

### GPULinearIndex

GPULinearIndex uses the exact same algorithm as LinearIndex for exact match search. Also, when the fuzzy search string exceeds 32 characters, it uses the same algorithm as LinearIndex. For fuzzy search, the bitap algorithm is implemented on the GPU. A search thread is created for every character position in the index, and a match search based on the bitap algorithm is performed for the length of the search string.

### HybridBigramInvertedIndex

HybridBigramInvertedIndex classifies characters into two categories, one for languages such as Japanese, where words are difficult to separate, and the other for languages such as English, where words can be separated by spaces, and generates different indexes for each. For English, an ordinary word-by-word inverted index was created, while for Japanese and other languages, an inverted index was created by fragmenting sentences using Bigram without separating words.
Although increasing the number of ngrams (e.g., Trigram) can reduce search noise, it increases the size of the index, so Bigram was used to consider a balance.

### Preprocessing

Preprocessing is simple: Unicode normalization (NFKC), lowercasing of alphabetic and other characters, and some normalization of Japanese. Stopwords and stemming are not used for inverted indexes, such as English. In addition, for characters (such as emojis) where one grapheme consists of multiple code points, only the first code point is extracted for the search. Since we aimed to be language-neutral, we did not include too many special processes, but aimed to achieve a range of search capabilities.

In addition to the above, HybridBigramInvertedIndex removes symbols and signs and uses them as delimiters, divides by whitespace, and divides by character type (classifying languages that cannot be tokenized, such as Japanese, and those that can). Therefore, symbols by themselves cannot be searched, and URLs are also tokenized. It would be nice if there was a mechanism that could be shared across all languages, but it seems to be incomplete. Intl.Segmenter() can be used for Japanese and Chinese, so we are looking forward to the future.

### Other algorithms to consider

When I tried Trie, the index size increased inversely. This was probably due to the addition of posting lists to all nodes for incremental searches. Aiming for language neutrality, we decided not to use Trie when indexing Japanese, as there was little advantage to using Bigram.

We considered using a Bloom filter, but the size of the posting list increased by the number of hash functions, which in turn increased the index size. It was an interesting data structure, but it is a pity. Incidentally, we got good specs for about 2-3 hash functions.

There were many other ideas that came to mind, such as LSH, minHash, and embedding by sentence transformer, but all of them were wrong in my opinion and could not be applied to full-text search, especially including fuzzy search. Simple exact matching was a possibility, but fuzzy search seemed pretty much impossible. For example, if a misspelled word was entered, it would result in a new word being added to the dictionary, resulting in one more dimension for a very high dimensional vector. The distance to the dimension with the shorter edit distance is the same as the distance to the other dimensions and cannot be compared. Even if we performed dimensionality reduction from there, we did not think it would be possible to generate vectors that correctly match similar words. However, I did feel the possibility of semantic search itself. As a result of my light examination, I realized that semantic search would require a server specification, so I will consider its realization at another time.

