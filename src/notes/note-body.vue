<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { format, formatDistance, isValid, parseISO } from 'date-fns'
import RichText from '../design/rich-text.vue'

const props = defineProps<{
  body: JSONContent | string
  createdAt?: string
}>()

// Refresh the relative timestamp every minute
const now = ref(new Date())
const nowTimer = window.setInterval(() => {
  now.value = new Date()
}, 60_000)
onBeforeUnmount(() => window.clearInterval(nowTimer))

const createdAtDate = computed(() => {
  if (!props.createdAt) {
    return null
  }
  const date = parseISO(props.createdAt)
  return isValid(date) ? date : null
})

const createdAtRelative = computed(() =>
  createdAtDate.value
    ? formatDistance(createdAtDate.value, now.value, { addSuffix: true })
    : null,
)
</script>

<template>
  <Card class="card">
    <template #content>
      <RichText :content="body" />
      <time
        v-if="createdAtDate"
        class="note-created-at"
        :datetime="createdAtDate.toISOString()"
        :title="format(createdAtDate, 'PPpp')"
      >
        {{ createdAtRelative }}
      </time>
    </template>
  </Card>
</template>

<style scoped>
.card {
  border: 1px solid var(--p-content-border-color);
}

.note-created-at {
  display: block;
  padding-top: 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}
</style>
