/** 按 id 去重数组 */
export const uniqueUserList = <T extends { id: number }>(arr: T[]): T[] => {
  const seen = new Set<number>()
  return arr.filter((item) => {
    const isNew = !seen.has(item.id)
    seen.add(item.id)
    return isNew
  })
}
