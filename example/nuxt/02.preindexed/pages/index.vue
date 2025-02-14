<script setup lang="ts">
import StaticSeek from "../component/StaticSeek.vue";

// ad-hock solution. you might as well use zod or something like that to validate the key.
function typedKey(key: Record<string, unknown>) {
    return key as { stem: string; body: { data: { title: string } } };
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
                <ul>
                    <li v-if="results.length === 0 && query.length !== 0">No results found.</li>
                    <template v-else>
                        <li v-for="{refs, key} in results" :key="typedKey(key).stem">
                            <NuxtLink :href="typedKey(key).stem" >
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

</style>
