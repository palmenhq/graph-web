export type ApiList<T> = {
  items: T[]
  nextCursor?: string | null
}

export const flattenPages = <T>(
  data: { pages: ApiList<T>[] } | undefined,
): T[] => data?.pages.flatMap((page) => page.items) ?? []
