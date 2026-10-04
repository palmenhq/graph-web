import { useQuery } from '@tanstack/vue-query'
import { apiClient, url } from './index.ts'
import { useWorkspaceId } from './use-current-workspace-query.ts'
import type { ApiList } from './api-list.ts'

export type Edge = {
  id: string
  edgeTypeId: string
  fromNode: string
  toNode: string
  relationshipTitle: string
  reverseRelationshipTitle: string
}

export const useNodeEdgesQuery = (nodeId: string) => {
  const workspaceId = useWorkspaceId()

  return useQuery({
    queryKey: ['w', workspaceId, 'edges', nodeId],
    queryFn: () =>
      apiClient
        .get<ApiList<Edge>>(
          url`/workspaces/${workspaceId}/graph/nodes/getEdges?id=${nodeId}`,
        )
        .then((r) => r.data),
  })
}
