<script setup lang="ts">
import { createIndex, LinearIndex, search, StaticSeekError } from 'staticseek'
import { computedAsync } from '@vueuse/core';

const query = ref('')
const { data } = await useAsyncData('search', () => queryCollection('contents').where('stem', '=', 'sentences').first())
const target = toValue(data.value)?.data ?? [];

const index = createIndex(LinearIndex, target);
if(index instanceof StaticSeekError) throw index;

const result = computedAsync(async () => await search(index, toValue(query)))
</script>

<template>
    <section style="max-width: 720px; margin-inline: auto">
        <h1><NuxtLink to="/">Home</NuxtLink></h1>

        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" v-model="query" style="width: 100%"/>
        </div>
        <h2>results</h2>
        <ul v-if="!(result instanceof StaticSeekError) && result !== undefined">
          <li v-for="r in result" :key="r.id">{{ target[r.id] }}</li>
        </ul>
    </section>
</template>
