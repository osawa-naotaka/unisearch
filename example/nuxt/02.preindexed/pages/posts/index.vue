<script setup lang="ts">
const route = useRoute();
const { data: posts } = await useAsyncData(route.path, () => queryCollection("posts").all());
</script>

<template>
  <section>
    <h2>all posts</h2>
    <ul>
        <li v-for="p in posts" :key="p.id"><a :href="p.path">{{ p.title }}</a></li>
    </ul>
  </section>
</template>
