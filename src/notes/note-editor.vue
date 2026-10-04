<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import type { JSONContent } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Mention from '@tiptap/extension-mention'
import { Placeholder } from '@tiptap/extensions'
import type { SuggestionProps } from '@tiptap/suggestion'
import type { Node } from '../api/use-nodes-query.ts'

type MentionItem = {
  id: string
  label: string
}

const props = defineProps<{
  nodes: Node[]
  placeholder?: string
}>()

const model = defineModel<JSONContent | null>({ default: null })

const maxSuggestions = 8

const suggestionItems = ref<MentionItem[]>([])
const suggestionIndex = ref(0)
const suggestionRect = ref<DOMRect | null>(null)
const suggestionOpen = ref(false)
let suggestionCommand: ((item: MentionItem) => void) | null = null

const updateSuggestion = (p: SuggestionProps<MentionItem, MentionItem>) => {
  suggestionItems.value = p.items
  suggestionRect.value = p.clientRect?.() ?? null
  suggestionCommand = p.command
  if (suggestionIndex.value >= p.items.length) {
    suggestionIndex.value = 0
  }
}

const selectSuggestion = (index: number) => {
  const item = suggestionItems.value[index]
  if (item && suggestionCommand) {
    suggestionCommand(item)
  }
}

const editor = useEditor({
  content: model.value ?? '',
  extensions: [
    Document,
    Paragraph,
    Text,
    Placeholder.configure({ placeholder: props.placeholder ?? '' }),
    Mention.configure({
      HTMLAttributes: { class: 'note-mention' },
      suggestion: {
        char: '@',
        items: ({ query }): MentionItem[] => {
          const q = query.toLowerCase()
          return props.nodes
            .filter((node) => node.title.toLowerCase().includes(q))
            .slice(0, maxSuggestions)
            .map((node) => ({ id: node.id, label: node.title }))
        },
        render: () => ({
          onStart: (p) => {
            suggestionIndex.value = 0
            suggestionOpen.value = true
            updateSuggestion(p)
          },
          onUpdate: updateSuggestion,
          onKeyDown: ({ event }) => {
            const count = suggestionItems.value.length
            if (event.key === 'Escape') {
              suggestionOpen.value = false
              return true
            }
            if (!suggestionOpen.value || count === 0) {
              return false
            }
            if (event.key === 'ArrowDown') {
              suggestionIndex.value = (suggestionIndex.value + 1) % count
              return true
            }
            if (event.key === 'ArrowUp') {
              suggestionIndex.value =
                (suggestionIndex.value - 1 + count) % count
              return true
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
              selectSuggestion(suggestionIndex.value)
              return true
            }
            return false
          },
          onExit: () => {
            suggestionOpen.value = false
            suggestionItems.value = []
            suggestionCommand = null
          },
        }),
      },
    }),
  ],
  onUpdate: ({ editor }) => {
    model.value = editor.getJSON()
  },
})

const clear = () => {
  editor.value?.commands.clearContent(true)
}

const focus = () => {
  editor.value?.commands.focus()
}

defineExpose({ clear, focus })

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="note-editor">
    <EditorContent :editor="editor" />

    <ul
      v-if="suggestionOpen && suggestionRect"
      class="note-suggestions"
      role="listbox"
      :style="{
        top: `${suggestionRect.bottom + 4}px`,
        left: `${suggestionRect.left}px`,
      }"
    >
      <li v-if="suggestionItems.length === 0" class="note-suggestion-empty">
        <em>No matching nodes</em>
      </li>
      <li
        v-for="(item, index) in suggestionItems"
        :key="item.id"
        role="option"
        :aria-selected="index === suggestionIndex"
        :class="{ 'is-selected': index === suggestionIndex }"
        @mousedown.prevent="selectSuggestion(index)"
        @mouseenter="suggestionIndex = index"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.note-editor :deep(.tiptap) {
  min-height: 4rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--p-inputtext-border-color);
  border-radius: var(--p-inputtext-border-radius);
  background: var(--p-inputtext-background);
  color: var(--p-inputtext-color);
  outline: none;
}

.note-editor :deep(.tiptap:focus) {
  border-color: var(--p-inputtext-focus-border-color);
}

.note-editor :deep(.tiptap p) {
  margin: 0;
}

.note-editor :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--p-inputtext-placeholder-color);
}

.note-editor :deep(.note-mention) {
  color: var(--p-primary-color);
  font-weight: 600;
}

.note-suggestions {
  position: fixed;
  z-index: 1200;
  min-width: 12rem;
  max-height: 16rem;
  overflow-y: auto;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-content-border-radius);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
}

.note-suggestions li {
  padding: 0.375rem 0.5rem;
  border-radius: var(--p-content-border-radius);
  cursor: pointer;
}

.note-suggestions li.is-selected {
  background: var(--p-highlight-background);
  color: var(--p-highlight-color);
}

.note-suggestions li.note-suggestion-empty {
  cursor: default;
}
</style>
