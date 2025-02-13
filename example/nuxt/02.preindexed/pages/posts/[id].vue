<script setup lang="ts">
import { ContentRenderer } from "#components";

const route = useRoute();
const { data: post } = await useAsyncData(route.path, () => queryCollection("posts").path(route.path).first());
</script>

<template>
  <article style="max-width: 720px; margin-inline: auto">
    <h2><a href="/">Home</a></h2>
    <div v-if="post">
      <h2>{{ post.title }}</h2>
      <ContentRenderer v-if="post" :value="post" />
    </div>
    <div v-else>post not found</div>
  </article>
</template>
