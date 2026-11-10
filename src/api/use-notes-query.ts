import { useQuery } from '@tanstack/vue-query'
import type { JSONContent } from '@tiptap/core'
import { apiClient, url } from './index.ts'
import { useWorkspaceId } from './use-current-workspace-query.ts'
import type { ApiList } from './api-list.ts'

export type NoteMention = {
  nodeId: string
}

export type NewNote = {
  nodeId: string
  body: JSONContent
  mentions: NoteMention[]
}

export type NoteNode = {
  id: string
  title: string
}

export type Note = Omit<NewNote, 'nodeId'> & {
  id: string
  node: NoteNode | null
  createdAt: string
}

export const extractMentions = (doc: JSONContent): NoteMention[] => {
  const nodeIds = new Set<string>()

  const walk = (content: JSONContent) => {
    if (content.type === 'mention' && typeof content.attrs?.id === 'string') {
      nodeIds.add(content.attrs.id)
    }
    content.content?.forEach(walk)
  }
  walk(doc)

  return [...nodeIds].map((nodeId) => ({ nodeId }))
}

export const useNodeNotesQuery = (nodeId: string) => {
  const workspaceId = useWorkspaceId()

  return useQuery({
    queryKey: ['w', workspaceId, 'notes', { nodeId }],
    queryFn: () =>
      apiClient
        .get<ApiList<Note>>(
          url`/workspaces/${workspaceId}/notes/getNotesForNode?nodeId=${nodeId}`,
        )
        .then((r) => r.data),
  })
}
