<script setup lang="ts">
import { ContentRenderer } from "#components";

const route = useRoute();
const { data: post } = await useAsyncData(route.path, () => queryCollection("posts").path(route.path).first());
</script>

<template>
  <article style="max-width: 720px; margin-inline: auto">
    <template v-if="post">
      <h2>{{ post.title }}</h2>
      <ContentRenderer v-if="post" :value="post" />
    </template>
    <div v-else>post not found</div>
  </article>
</template>
