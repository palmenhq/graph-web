import type { NodeType } from '../api/use-node-types-query.ts'

export const getNodeTypeTitle = (nodeTypes: NodeType[], nodeTypeId: string) =>
  nodeTypes.find((nodeType) => nodeType.id === nodeTypeId)?.title
