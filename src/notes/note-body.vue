<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { format, formatDistance, isValid, parseISO } from 'date-fns'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import type { Node } from '../api/use-nodes-query.ts'

const props = defineProps<{
  body: JSONContent
  nodes: Node[]
  createdAt?: string
}>()

const workspaceId = useWorkspaceId()

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

const paragraphs = computed<JSONContent[]>(() =>
  (props.body.content ?? []).filter((block) => block.type === 'paragraph'),
)

const mentionLabel = (inline: JSONContent) =>
  props.nodes.find((node) => node.id === inline.attrs?.id)?.title ??
  inline.attrs?.label ??
  inline.attrs?.id

const mentionLink = (inline: JSONContent) =>
  `/w/${workspaceId}/nodes/${inline.attrs?.id}`
</script>

<template>
  <Card class="card">
    <template #content>
      <div class="note-body">
        <p v-for="(paragraph, pIndex) in paragraphs" :key="pIndex">
          <template
            v-for="(inline, iIndex) in paragraph.content ?? []"
            :key="iIndex"
          >
            <RouterLink
              v-if="inline.type === 'mention'"
              :to="mentionLink(inline)"
              class="note-mention"
              >@{{ mentionLabel(inline) }}</RouterLink
            >
            <template v-else-if="inline.type === 'text'">{{
              inline.text
            }}</template>
          </template>
        </p>
      </div>
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

.note-body p {
  margin: 0;
  min-height: 1lh;
  white-space: pre-wrap;
}

.note-created-at {
  display: block;
  padding-top: 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}

.note-mention {
  color: var(--p-primary-color);
  font-weight: 600;
  text-decoration: none;
}

.note-mention:hover {
  text-decoration: underline;
}
</style>
