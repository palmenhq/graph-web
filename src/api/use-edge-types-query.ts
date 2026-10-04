import { useQuery } from '@tanstack/vue-query'
import { apiClient, url } from './index.ts'
import { useWorkspaceId } from './use-current-workspace-query.ts'
import type { ApiList } from './api-list.ts'

export type EdgeType = {
  id: string
  relationshipTitle: string
  reverseRelationshipTitle: string | null
  createdAt: string
  workspaceId: string
}

export const useEdgeTypesQuery = () => {
  const workspaceId = useWorkspaceId()

  return useQuery({
    queryKey: ['w', workspaceId, 'edgeTypes'],
    queryFn: () =>
      apiClient
        .get<ApiList<EdgeType>>(
          url`/workspaces/${workspaceId}/graph/edgeTypes/getAll`,
        )
        .then((r) => r.data),
  })
}
