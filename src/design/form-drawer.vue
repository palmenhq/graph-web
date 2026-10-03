<script setup lang="ts"></script>

<template>
  <form class="drawer-form" @submit.prevent>
    <slot />
  </form>
</template>

<style scoped>
.drawer-form {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
