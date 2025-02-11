<script setup lang="ts">
import type { SearchResult, StaticSeekIndex } from 'staticseek';
import { StaticSeekError, createIndexFromObject, search } from 'staticseek';

// ad-hock solution. you might as well use zod or something like that to validate the key.
function typedKey(key: Record<string, unknown>) {
    return key as { path: string, body: { data: { title: string } } };
}

const INDEX_STATE = {
    NOT_INITIALIZED: 0,
    FETCHING: 1,
    INITIALIZED: 2,
} as const;
type INDEX_STATE = typeof INDEX_STATE[keyof typeof INDEX_STATE];

const results = ref<SearchResult[]>([]);
const index_state = ref<INDEX_STATE>(INDEX_STATE.NOT_INITIALIZED);
const index = ref<StaticSeekIndex | null>(null);

const handleSearch = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const start = performance.now();
    
    if (index_state.value === INDEX_STATE.FETCHING) return;
    if (index_state.value !== INDEX_STATE.INITIALIZED) {
        index_state.value = INDEX_STATE.FETCHING;

        const response = await fetch('/searchindex.json');
        if (!response.ok) {
            console.error(`fail to fetch index: ${response.statusText}`);
            index_state.value = INDEX_STATE.NOT_INITIALIZED;
            return;
        }
        
        const response_json = await response.json();
        const newIndex = createIndexFromObject(response_json);

        if (newIndex instanceof StaticSeekError) {
            console.error(newIndex);
            index_state.value = INDEX_STATE.NOT_INITIALIZED;
            return;
        }

        index.value = newIndex;
        const searchResults = await search(newIndex, target.value);
        if (searchResults instanceof StaticSeekError) {
            console.error(searchResults);
            return;
        }
        
        results.value = searchResults;
        console.log(`search time: ${performance.now() - start}ms`);
        console.log(`index size: ${new Blob([JSON.stringify(response_json)]).size} byte.`);
        index_state.value = INDEX_STATE.INITIALIZED;
        return;
    }

    if (!index.value) return;
    const searchResults = await search(index.value, target.value);
    if (searchResults instanceof StaticSeekError) {
        console.error(searchResults);
        return;
    }
    
    results.value = searchResults;
    console.log(`search time: ${performance.now() - start}ms`);
};
</script>

<template>
    <section style="max-width: 720px; margin-inline: auto">
        <h1><NuxtLink to="/">Home</NuxtLink></h1>

        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" @input="handleSearch" style="width: 100%"/>
        </div>
        <h2>results</h2>
        <ul>
            <li v-if="index_state === INDEX_STATE.FETCHING">loading search index...</li>
            <li v-else-if="results.length === 0">No results found.</li>
            <template v-else>
                <li v-for="{refs, key} in results" :key="typedKey(key).path">
                    <NuxtLink :href="typedKey(key).path" >
                        <h3>{{ typedKey(key).body.data.title }}</h3>
                    </NuxtLink>
                    <p>{{ refs[0].wordaround }}</p>
                </li>
            </template>
        </ul>
    </section>
</template>
