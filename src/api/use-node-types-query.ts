import { useQuery } from '@tanstack/vue-query'
import { apiClient, url } from './index.ts'
import { useWorkspaceId } from './use-current-workspace-query.ts'
import type { ApiList } from './api-list.ts'

export type NodeType = {
  id: string
  title: string
  createdAt: string
  workspaceId: string
}

export const useNodeTypesQuery = () => {
  const workspaceId = useWorkspaceId()

  return useQuery({
    queryKey: ['w', workspaceId, 'nodeTypes'],
    queryFn: () =>
      apiClient
        .get<ApiList<NodeType>>(
          url`/workspaces/${workspaceId}/graph/nodeTypes/getAll`,
        )
        .then((r) => r.data),
  })
}
