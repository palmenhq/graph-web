import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import type { JSONContent } from '@tiptap/core'
import { apiClient, url } from './index.ts'
import { useWorkspaceId } from './use-current-workspace-query.ts'
import type { ApiList } from './api-list.ts'

export type NoteMention = {
  nodeId: string
}

export type NewNote = {
  body: JSONContent
  mentions: NoteMention[]
}

export type Note = NewNote & {
  id: string
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

export const useNotesQuery = () => {
  const workspaceId = useWorkspaceId()

  return useInfiniteQuery({
    queryKey: ['w', workspaceId, 'notes'],
    queryFn: ({ pageParam }) =>
      apiClient
        .get<ApiList<Note>>(url`/workspaces/${workspaceId}/notes/getAll`, {
          params: { cursor: pageParam },
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

export const useNodeNotesQuery = (nodeId: string) => {
  const workspaceId = useWorkspaceId()

  return useQuery({
    queryKey: ['w', workspaceId, 'notes', 'byMentionedNode', nodeId],
    queryFn: () =>
      apiClient
        .get<ApiList<Note>>(
          url`/workspaces/${workspaceId}/notes/getByMentionedNode?nodeId=${nodeId}`,
        )
        .then((r) => r.data),
  })
}
