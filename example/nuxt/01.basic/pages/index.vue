<script setup lang="ts">
import { createIndex, LinearIndex, search, StaticSeekError } from 'staticseek'
import { computedAsync } from '@vueuse/core';

const query = ref('')
const { data } = await useAsyncData('search', () => queryCollection('contents').where('stem', '=', 'sentences').first())
const target = toValue(data.value)?.data ?? [];

const index = createIndex(LinearIndex, target);
if(index instanceof StaticSeekError) throw index;

const result = computedAsync(async () => await search(index, toValue(query)), [])
</script>

<template>
    <section style="max-width: 720px; margin-inline: auto">
        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" v-model="query" style="width: 100%"/>
        </div>
        <h2>results</h2>
        <ul v-if="!(result instanceof StaticSeekError) && query.length !== 0">
            <li key="header">
                    <div class="sentence">sentence</div>
                    <div>score</div>
            </li>
            <li v-for="r in result" :key="r.id">
                <div class="sentence">{{ target[r.id] }}</div>
                <div class="score">{{ r.score.toFixed(4) }}</div>
            </li>
        </ul>
        <ul v-else-if="query.length === 0">
            <li key="header">
                    <div class="sentence">sentence</div>
                    <div>score</div>
            </li>
            <li v-for="r in target" :key="r">
                <div class="sentence">{{ r }}</div>
                <div></div>
            </li>
        </ul>
    </section>
</template>

<style lang="css" scoped>
.input-area {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.input-area > input {
    flex-grow: 1;
    padding-inline: 0.5rem;
}

ul {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

li {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

ul > :first-child {
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--color-main);
}

li > .sentence {
    padding-inline: 1rem;
}

li > .score {
    border-radius: 8px;
    padding-inline: 0.5rem;
    padding-block: 0.4rem;
    background-color: var(--color-title-background);
    line-height: 0.8;
}
</style>
