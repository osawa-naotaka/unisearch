<script setup lang="ts">
import { asyncComputed } from "@vueuse/core";
import type { SearchResult, StaticSeekIndex } from "staticseek";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";

// ad-hock solution. you might as well use zod or something like that to validate the key.
function typedKey(key: Record<string, unknown>) {
    return key as { stem: string; body: { data: { title: string } } };
}

const { data } = await useFetch<StaticSeekIndex>("/searchindex.json");
if(!data.value) {
    throw new Error("Failed to fetch search index.");
}
const newIndex = createIndexFromObject(data.value);

if (newIndex instanceof StaticSeekError) {
    throw newIndex;
}

const index = newIndex;
const results = ref<SearchResult[]>([]);

async function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if(!index) {
        return [];
    }
    const searchResults = await search(index, target.value);
    if (searchResults instanceof StaticSeekError) {
        console.error(searchResults);
        return [];
    }

    results.value = searchResults;
}

</script>

<template>
    <section>
        <h1><NuxtLink to="/">Home</NuxtLink></h1>

        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" @input="handleInput" />
        </div>
        <h2>results</h2>
        <ul>
            <li v-if="results.length === 0">No results found.</li>
            <template v-else>
                <li v-for="{refs, key} in results" :key="typedKey(key).stem">
                    <NuxtLink :href="typedKey(key).stem" >
                        <h3>{{ typedKey(key).body.data.title }}</h3>
                    </NuxtLink>
                    <p>{{ refs[0].wordaround }}</p>
                </li>
            </template>
        </ul>
    </section>
</template>
