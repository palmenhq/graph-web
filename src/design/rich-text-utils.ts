import type { JSONContent } from '@tiptap/core'

export const parseNoteBody = (raw?: string | null): JSONContent | null => {
  if (!raw?.trim()) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
      return parsed
    }
  } catch {
    // not JSON
  }
  const lines = raw.split('\n')
  return {
    type: 'doc',
    content: lines.map((line) => ({
      type: 'paragraph',
      content: line ? [{ type: 'text', text: line }] : [],
    })),
  }
}

export const serializeNoteBody = (doc?: JSONContent | null): string | null => {
  if (!doc || isEmptyNoteBody(doc)) {
    return null
  }
  return JSON.stringify(doc)
}

// Plain text version of a note body, one line per block
export const noteBodyToText = (doc: JSONContent): string => {
  const inlineText = (content: JSONContent): string => {
    if (content.type === 'text') {
      return content.text ?? ''
    }
    if (content.type === 'mention') {
      return `@${content.attrs?.label ?? content.attrs?.id ?? ''}`
    }
    if (content.type === 'hardBreak') {
      return '\n'
    }
    return (content.content ?? []).map(inlineText).join('')
  }
  return (doc.content ?? []).map(inlineText).join('\n')
}

export const isEmptyNoteBody = (doc: JSONContent): boolean => {
  const hasContent = (content: JSONContent): boolean =>
    content.type === 'mention' ||
    (content.type === 'text' && !!content.text?.trim()) ||
    (content.content ?? []).some(hasContent)

  return !hasContent(doc)
}
