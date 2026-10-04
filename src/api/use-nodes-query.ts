import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
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

export const useNodesQuery = () => {
  const workspaceId = useWorkspaceId()

  return useQuery({
    queryKey: ['w', workspaceId, 'nodes'],
    queryFn: () =>
      apiClient
        .get<ApiList<Node>>(url`/workspaces/${workspaceId}/graph/nodes/getAll`)
        .then((r) => r.data),
  })
}

export const useNodeSearchQuery = (search: MaybeRefOrGetter<string>) => {
  const workspaceId = useWorkspaceId()
  const term = computed(() => toValue(search).trim())

  return useQuery({
    queryKey: computed(() =>
      term.value
        ? ['w', workspaceId, 'nodes', 'search', term.value]
        : ['w', workspaceId, 'nodes'],
    ),
    queryFn: () =>
      apiClient
        .get<ApiList<Node>>(
          term.value
            ? url`/workspaces/${workspaceId}/graph/nodes/getAll?search=${term.value}`
            : url`/workspaces/${workspaceId}/graph/nodes/getAll`,
        )
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}
