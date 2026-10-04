import { useQuery } from '@tanstack/vue-query'
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
