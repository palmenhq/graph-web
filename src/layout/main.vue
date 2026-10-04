<script setup lang="ts"></script>

<template>
  <div class="container">
    <div class="main">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  min-height: 100vh;
}

.main {
  width: 100%;
  max-width: 1200px;
  padding: 1rem;
  justify-self: center;
}

.logo {
  font-size: 1.25rem;
  margin: 0;
}
</style>
