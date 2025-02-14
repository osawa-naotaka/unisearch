<script setup lang="ts">
import { ContentRenderer } from "#components";

const route = useRoute();
const { data: post } = await useAsyncData(route.path, () => queryCollection("posts").path(route.path).first());
</script>

<template>
  <section>
    <article v-if="post">
      <h2>{{ post.title }}</h2>
      <ContentRenderer v-if="post" :value="post" />
    </article>
    <div v-else>post not found</div>
  </section>
</template>
