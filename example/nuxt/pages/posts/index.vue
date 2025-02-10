<script setup lang="ts">

const { data: posts } = await useAsyncData("allposts", () => queryCollection('posts').all());

</script>

<template>
  <div style="max-width: 720px; margin-inline: auto">
    <h1>Posts</h1>
    <ul>
      <li v-for="post in posts" :key="post.id">
        <a :href="`${post.path}`">{{ post.title }}</a>
      </li>
    </ul>
  </div>
</template>
