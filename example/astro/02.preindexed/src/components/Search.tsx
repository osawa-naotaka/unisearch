import type { SearchKey } from "../pages/searchindex.json";
import { lazy, useState } from "react";
import type { JSX } from "react";
import type { SearchResult } from "staticseek";

const StaticSeek = lazy(() => import("staticseek-react"));

function StaticSeekResult(result: SearchResult[]): JSX.Element {
    const lis = result.map((item) => {
        const key = item.key as SearchKey; // ad-hock solution. you might as well use zod or something like that to validate the key.
        return (
            <li key={key.id}>
                <a href={`/posts/${key.id}`}>
                    <h3>{key.data.title}</h3>
                </a>
                <p>{item.refs[0].wordaround}</p>
            </li>
        );
    });

    return (
        <>
            <h2>results</h2>
            <ul>{result.length > 0 ? lis : <li>No results found.</li>}</ul>
        </>
    );
}

export default function Search() {
    const [query, setQuery] = useState<string>("");
    const [trigger, setTrigger] = useState<boolean>(false);

    function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        setTrigger(true);
    }

    return (
        <section>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="type your search query in English..." onChange={onChangeInput} />
            </div>
            {trigger && (
                <StaticSeek query={query} indexUrl="/searchindex.json" suspense={<div>Loading index...</div>}>
                    {StaticSeekResult}
                </StaticSeek>
            )}
        </section>
    );
}
