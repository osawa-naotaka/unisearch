<script setup lang="ts">
import StaticSeek from "../component/StaticSeek.vue";

// ad-hock solution. you might as well use zod or something like that to validate the key.
function typedKey(key: Record<string, unknown>) {
    return key as { path: string; body: { data: { title: string } } };
}

const query = ref("");
const trigger = ref(false);
</script>

<template>
    <section>
        <div class="input-area">
            <div>search</div>
            <input type="text" name="search" id="search" v-model="query" @input="() => { trigger = true }"/>
        </div>
        <StaticSeek v-if="trigger" :query="query" url="/searchindex.json">
            <template #default="{ results }">
                <h2>results</h2>
                <ul class="search-results">
                    <li v-if="results.length === 0 && query.length !== 0">No results found.</li>
                    <template v-else>
                        <li v-for="{refs, key} in results" :key="typedKey(key).path">
                            <NuxtLink :to="typedKey(key).path" >
                                <h3>{{ typedKey(key).body.data.title }}</h3>
                            </NuxtLink>
                            <p>{{ refs[0].wordaround }}</p>
                        </li>
                    </template>
                </ul>
            </template>
            <template #suspence><div>loading index...</div></template>
        </StaticSeek>
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
