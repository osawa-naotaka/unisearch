<template>
    <NuxtLayout>
      <main>
        <NuxtPage/>
      </main>
    </NuxtLayout>
</template>
<style lang="css">
@charset "utf-8";

* {
    margin: 0;
    padding: 0;

    box-sizing: border-box;
}

a {
    color: inherit;
    text-decoration: none;
}

ul {
    list-style: none;
}

:root {
    --color-main: #303030;
    --color-title-background: #c0c0c0;
    --color-background: #f0f0f0;
    --color-accent: #d7003a;
    --content-width: 740px;
    --content-padding: 1rem;
}
:root {
    font-size: 18px;
    line-height: 1.8;
    font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
}
p {
    text-indent: 1rem;
}

body {
    color: var(--color-main);
    background-color: var(--color-background);
}

main {
    max-width: var(--content-width);
    box-sizing: content-box;
    margin-inline: auto;
    margin-block: var(--content-padding);
    padding-inline: var(--content-padding);
}

footer {
    text-align: center;
    position: fixed;
    bottom: 0;
    width: 100%;
    color: var(--color-background);
    background-color: var(--color-main);
}
</style>
