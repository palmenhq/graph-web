import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import { apiClient, url } from './index.ts'
import { useWorkspaceId } from './use-current-workspace-query.ts'
import type { ApiList } from './api-list.ts'

export type Node = {
  id: string
  title: string
  nodeTypeId: string
  createdAt: string
  workspaceId: string
}

const fetchNodes = (
  workspaceId: string,
  params: { search?: string; cursor?: string },
) =>
  apiClient
    .get<ApiList<Node>>(url`/workspaces/${workspaceId}/graph/nodes/getAll`, {
      params,
    })
    .then((r) => r.data)

export const useNodesQuery = () => {
  const workspaceId = useWorkspaceId()

  return useInfiniteQuery({
    queryKey: ['w', workspaceId, 'nodes'],
    queryFn: ({ pageParam }) => fetchNodes(workspaceId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

export const useNodeSearchQuery = (search: MaybeRefOrGetter<string>) => {
  const workspaceId = useWorkspaceId()
  const term = computed(() => toValue(search).trim())

  return useInfiniteQuery({
    queryKey: computed(() =>
      term.value
        ? ['w', workspaceId, 'nodes', 'search', term.value]
        : ['w', workspaceId, 'nodes'],
    ),
    queryFn: ({ pageParam }) =>
      fetchNodes(workspaceId, {
        search: term.value || undefined,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  })
}

export const useFetchNodeSuggestions = () => {
  const workspaceId = useWorkspaceId()
  const queryClient = useQueryClient()

  return async (search: string): Promise<Node[]> => {
    const term = search.trim()
    const page = await queryClient.query({
      queryKey: ['w', workspaceId, 'nodes', 'suggestions', term],
      queryFn: () => fetchNodes(workspaceId, { search: term || undefined }),
      staleTime: 30000,
    })
    return page.items
  }
}
