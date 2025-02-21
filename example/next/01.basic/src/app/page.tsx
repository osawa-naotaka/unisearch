"use client";

import { useEffect, useRef, useState } from "react";
import { LinearIndex, StaticSeekError, createIndex, search } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";

const target = [
    "The sun sets behind the quiet mountain.",
    "She found an old book in the dusty attic.",
    "A gentle breeze rustled through the tall trees.",
    "The cat slept peacefully on the warm windowsill.",
    "He walked along the beach, collecting seashells.",
    "They discovered a hidden cave in the forest.",
    "The clock struck midnight, filling the room with chimes.",
    "A mysterious letter arrived in the morning mail.",
    "She painted a beautiful sunset on the canvas.",
    "The little boy laughed as he chased butterflies.",
    "The candle flickered as the wind blew through the window.",
    "She carefully placed a bookmark in her favorite novel.",
    "The train whistle echoed through the quiet countryside.",
    "A fisherman repaired his net by the dock.",
    "The artist mixed colors on the palette before painting.",
    "The little boy chased butterflies in the garden.",
    "A warm breeze carried the scent of jasmine flowers.",
    "The baker kneaded dough with skillful hands.",
    "She wrote a poem about the beauty of autumn leaves.",
    "The owl hooted softly from a tree branch.",
    "A kind stranger helped carry the heavy suitcase.",
    "They watched the sunrise from a mountain peak.",
    "The kitten played with a ball of yarn.",
    "She traced patterns in the sand with her fingers.",
    "The farmer guided the cows back to the barn.",
    "A violinist played a hauntingly beautiful tune.",
    "The campfire crackled as they roasted marshmallows.",
    "He tied his shoelaces before going for a run.",
    "The rain washed away footprints on the dirt road.",
    "She arranged a bouquet of roses in a glass jar.",
    "The librarian sorted books onto the wooden shelves.",
    "A paper boat floated down the narrow stream.",
    "He whistled a cheerful tune while walking home.",
    "The squirrel nibbled on an acorn under the tree.",
    "She watched a shooting star and made a wish.",
    "The young girl practiced ballet in the empty studio.",
    "A black cat sat on the fence, watching the street.",
    "The carpenter sanded the surface of the wooden table.",
    "She blew a kiss to her loved one from afar.",
    "The puppy fell asleep curled up in a soft blanket.",
];

export default function Index() {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<SearchResult[]>([]);
    const index = useRef<StaticSeekIndex | null>(null);

    useEffect(() => {
        const newIndex = createIndex(LinearIndex, target);
        if (newIndex instanceof StaticSeekError) {
            console.error(newIndex);
            return;
        }
        index.current = newIndex;
    }, []);

    async function execSearch(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        if (index.current) {
            const r = await search(index.current, e.target.value);
            if (r instanceof StaticSeekError) {
                console.error(r);
                return;
            }
            setResult(r);
        }
    }

    return (
        <section>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="Enter the following keywords" onChange={execSearch} />
            </div>
            <ol>
                <li key="header">
                    <div className="sentence">sentence</div>
                    <div>score</div>
                </li>
                {result.length === 0 && query === ""
                    ? target.map((r, idx) => (
                          // biome-ignore lint: use index as key field.
                          <li key={idx}>
                              <div className="sentence">{r}</div>
                              <div />
                          </li>
                      ))
                    : result.map((r) => (
                          <li key={r.id}>
                              <div className="sentence">{target[r.id]}</div>
                              <div className="score">{r.score.toFixed(4)}</div>
                          </li>
                      ))}
            </ol>
        </section>
    );
}
