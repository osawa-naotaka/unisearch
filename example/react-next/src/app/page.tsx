"use client"

import { search, UniSearchError, createIndexFromObject } from "unisearch.js";
import type { UniSearchIndex, SearchResult } from "unisearch.js";
import Link from "next/link";
import { useState } from "react";

export default function Index() {
  const INDEX_STATE = {
    NOT_INITIALIZED: 0,
    FETCHING: 1,
    INITIALIZED: 2
  } as const;
  type INDEX_STATE = typeof INDEX_STATE[keyof typeof INDEX_STATE];

  const [results, setResults] = useState<SearchResult[]>([]);
  const [index_state, setIndexState] = useState<INDEX_STATE>(INDEX_STATE.NOT_INITIALIZED);
  const [index, setIndex] = useState<UniSearchIndex | null>(null);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = performance.now();
    if (index_state === INDEX_STATE.FETCHING) return;
    if (index_state !== INDEX_STATE.INITIALIZED) {
      setIndexState(INDEX_STATE.FETCHING);

      const response = await fetch("/linearindex.json");
      const response_json = await response.json();
      const newIndex = createIndexFromObject(response_json);
      
      if (newIndex instanceof UniSearchError) {
        console.error(newIndex);
        return;
      }
      
      setIndex(newIndex); 

      setResults(await execSearch(newIndex, e.target.value));
      setIndexState(INDEX_STATE.INITIALIZED);
      console.log(`search time: ${performance.now() - start}ms`);
      return ;
    }

    if(!index) return;
    setResults(await execSearch(index, e.target.value));
    console.log(`search time: ${performance.now() - start}ms`);
  };

  return (
    <section>
      <div className="input-area">
        <div>search</div>
        <input type="text" name="search" id="search" onChange={handleSearch} />
      </div>
      <h2>results</h2>
        <ul>
          {results.length > 0 && results.map((r) => (
            <li key={r.key.slug as string}>
              <Link href={`/posts/${r.key.slug as string}`}><h3>{r.key.title as string}</h3></Link>
              <p>{r.refs[0].wordaround}</p>
            </li>
          ))}
        </ul>
    </section>
  );
}

async function execSearch(index: UniSearchIndex, searchText: string): Promise<SearchResult[]> {
  const results = await search(index, searchText);
  if (results instanceof UniSearchError) {
    return [];
  } else {
    return results;
  }
}
