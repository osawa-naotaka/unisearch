<script setup lang="ts">
import { createSearchFn, StaticSeekError } from "staticseek";
import type { SearchResult } from "staticseek";
import * as v from "valibot";

const schema = v.object({
    path: v.string(),
    body: v.object({
        data: v.object({
            title: v.string(),
        }),
    }),
});

const search_fn = createSearchFn("/searchindex.json", (x) => { loading.value = x });
const loading   = ref(false);
const results   = ref<SearchResult[]>([]);
const query     = ref("");

async function onInputQuery(e: Event) {
    if(e.target instanceof HTMLInputElement) {
        const r = await search_fn(e.target.value);
        if(!(r instanceof StaticSeekError)) {
            results.value = r;
        }
    }
}
</script>

<template>
    <section>
        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" v-model="query" @input="onInputQuery"/>
        </div>
        <div v-if="loading">
            Loading index...
        </div>
        <template v-else>
            <h2>results</h2>
            <ul class="search-results">
                <li v-if="results.length === 0 && query.length !== 0">No results found.</li>
                <template v-else>
                    <li v-for="{refs, key} in results" :key="v.parse(schema, key).path">
                        <NuxtLink :to="v.parse(schema, key).path" >
                            <h3>{{ v.parse(schema, key).body.data.title }}</h3>
                        </NuxtLink>
                        <p>{{ refs[0].wordaround }}</p>
                    </li>
                </template>
            </ul>
        </template>
    </section>
</template>

<style lang="css">
.input-area {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.input-area > input {
    flex-grow: 1;
}

.search-results {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.search-results > li h3 {
    width: 100%;
    padding-inline: var(--content-padding);
    font-size: 1.2rem;
    border-bottom: 3px solid var(--color-main);
}
</style>
