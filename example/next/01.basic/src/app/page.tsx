"use client";

import { useEffect, useRef, useState } from "react";
import { LinearIndex, StaticSeekError, createIndex, search } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";

const target = [
    "apple",
    "bridge",
    "candle",
    "dragon",
    "eclipse",
    "feather",
    "glacier",
    "horizon",
    "island",
    "jungle",
    "knight",
    "lantern",
    "mountain",
    "nebula",
    "ocean",
    "puzzle",
    "quartz",
    "raven",
    "spectrum",
    "tornado",
];

export default function Index() {
    const [result, setResult] = useState<SearchResult[]>([]);
    const index = useRef<StaticSeekIndex | null>(null);

    useEffect(() => {
        const newIndex = createIndex(LinearIndex, target);
        if (newIndex instanceof StaticSeekError) {
            console.error(index);
            return;
        }
        index.current = newIndex;
    }, []);

    async function execSearch(e: React.ChangeEvent<HTMLInputElement>) {
        if (index.current) {
            const result = await search(index.current, e.target.value);
            if (result instanceof StaticSeekError) {
                console.error(result);
                return;
            }
            setResult(result);
        }
    }

    return (
        <section>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="Enter the following keywords" onChange={execSearch} />
            </div>
            <ul>
                {result.length === 0
                    ? target.map((r, idx) => (
                          // biome-ignore lint: use index as key field.
                          <li key={idx}>
                              <div>{r}</div>
                          </li>
                      ))
                    : result.map((r) => (
                          <li key={r.id}>
                              <div>{target[r.id]}</div>
                          </li>
                      ))}
            </ul>
        </section>
    );
}
