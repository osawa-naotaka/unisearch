<script setup lang="tsx">
import { asyncComputed } from "@vueuse/core";
import type { StaticSeekIndex } from "staticseek";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";

interface Props {
    query: string,
    url: string,
}
const { query, url } = defineProps<Props>();

const start = performance.now();
const { data } = await useFetch<StaticSeekIndex>(url);
if (!data.value) {
    throw new Error("Failed to fetch search index.");
}
const newIndex = createIndexFromObject(data.value);

if (newIndex instanceof StaticSeekError) {
    throw newIndex;
}
console.log("Loading index took", performance.now() - start, " ms");

const index = newIndex;

const results = asyncComputed(async () => {
    if (!index) {
        return [];
    }
    const start = performance.now();
    const searchResults = await search(index, query);
    if (searchResults instanceof StaticSeekError) {
        console.error(searchResults);
        return [];
    }
    console.log("Searching took", performance.now() - start, " ms");

    return searchResults;
}, []);

</script>

<template>
    <slot :results="results"></slot>
</template>
<style lang="css">
ul {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

li h3 {
    width: 100%;
    padding-inline: var(--content-padding);
    font-size: 1.2rem;
    border-bottom: 3px solid var(--color-main);
}
</style>
