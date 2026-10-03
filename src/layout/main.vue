<script setup lang="ts"></script>

<template>
  <div class="container">
    <div class="sidebar">
      <h1 class="logo"><router-link to="/w">Recsnap</router-link></h1>
    </div>

    <div class="main">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 15rem 1fr;
  min-height: 100vh;
}

.sidebar {
  width: 100%;
  background: var(--p-surface-900);
  border-right: 1px solid var(--p-panel-border-color);
  padding: 1rem;
}

.main {
  width: 100%;
  max-width: 1200px;
  padding: 1rem;
}

.logo {
  font-size: 1.25rem;
  margin: 0;
}
</style>
