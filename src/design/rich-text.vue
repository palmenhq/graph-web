<script setup lang="ts">
import { computed } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import { parseNoteBody } from './rich-text-utils.ts'

const props = defineProps<{
  content?: JSONContent | string | null
}>()

const workspaceId = useWorkspaceId()

const doc = computed<JSONContent | null>(() => {
  if (!props.content) {
    return null
  }
  if (typeof props.content === 'string') {
    return parseNoteBody(props.content)
  }
  return props.content
})

const paragraphs = computed<JSONContent[]>(() => {
  if (!doc.value) {
    return []
  }
  return (doc.value.content ?? []).filter((block) => block.type === 'paragraph')
})

const mentionLabel = (inline: JSONContent) =>
  inline.attrs?.label ?? inline.attrs?.id

const mentionLink = (inline: JSONContent) =>
  `/w/${workspaceId}/nodes/${inline.attrs?.id}`
</script>

<template>
  <div class="rich-text">
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
</template>

<style scoped>
.rich-text p {
  margin: 0;
  min-height: 1lh;
  white-space: pre-wrap;
}
</style>
