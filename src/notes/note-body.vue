<script setup lang="ts">
import { computed } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import type { Node } from '../api/use-nodes-query.ts'

const props = defineProps<{
  body: JSONContent
  nodes: Node[]
}>()

const workspaceId = useWorkspaceId()

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
</template>

<style scoped>
.note-body p {
  margin: 0;
  min-height: 1lh;
  white-space: pre-wrap;
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
