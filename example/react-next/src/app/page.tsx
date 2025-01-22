"use client"

import { search, UniSearchError, createIndexFromObject } from "unisearch.js";
import type { UniSearchIndex, SearchResult } from "unisearch.js";
import Link from "next/link";
import { useState } from "react";

export default function Index() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const INDEX_STATE = {
    NOT_INITIALIZED: 0,
    FETCHING: 1,
    INITIALIZED: 2
  } as const;
  type INDEX_STATE = typeof INDEX_STATE[keyof typeof INDEX_STATE];

  let index_state : INDEX_STATE = INDEX_STATE.NOT_INITIALIZED;
  let index : UniSearchIndex | null = null;

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (index_state === INDEX_STATE.FETCHING) return;
    if (index_state !== INDEX_STATE.INITIALIZED) {
      index_state = INDEX_STATE.FETCHING;

      const response = await fetch("/linearindex.json");
      const response_json = await response.json();
      const newIndex = createIndexFromObject(response_json);
      
      if (newIndex instanceof UniSearchError) {
        console.error(newIndex);
        return;
      }
      
      index = newIndex; 

      index_state = INDEX_STATE.INITIALIZED;
    }
    if(!index) return;
    
    const searchText = e.target.value;
    const results = await search(index, searchText);
    if (results instanceof UniSearchError) {
      setResults([]);
    } else {
      setResults(results);
    }
  };

  return (
    <section>
      <h3 className="text-3xl mb-3 leading-snug">search</h3>
      <input type="text" name="search" id="search" onChange={handleSearch} />
      <h3 className="text-3xl mb-3 leading-snug">results</h3>
        <ul>
          {results.length > 0 && results.map((r) => (
            <li key={r.key.slug as string}>
              <h4><Link href={`/posts/${r.key.slug as string}`} className="hover:underline">{r.key.title as string}</Link></h4>
              <p>{r.refs[0].wordaround}</p>
            </li>
          ))}
        </ul>
    </section>
  );
}
