import type { TableEntity } from "@/types"

/**
 * 将驼峰命名分割为单词
 * 例如: "TestTable" -> "Test Table"
 */
function splitCamelCase(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1 $2")
}

/**
 * 规范化搜索文本，返回token数组
 * 处理特殊字符、驼峰命名、转小写
 */
export function normalizeSearchText(text: string): string[] {
  if (!text || typeof text !== "string") return []

  const withSpaces = splitCamelCase(text)

  // 替换分隔符为空格，只保留字母数字
  const normalized = withSpaces
    .toLowerCase()
    .replace(/[_\-\.]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")

  return normalized
    .split(/\s+/)
    .filter((token) => token.length > 0)
}

/**
 * 检查目标文本是否匹配搜索tokens
 * 所有search tokens必须在target中找到
 */
export function matchesSearch(
  targetText: string,
  searchTokens: string[]
): boolean {
  if (searchTokens.length === 0) return true

  const targetTokens = normalizeSearchText(targetText)
  const targetString = targetTokens.join(" ")

  return searchTokens.every((searchToken) =>
    targetString.includes(searchToken)
  )
}

/**
 * 过滤表实体数组
 * 在displayName和logicalName上搜索
 */
export function filterTables(
  tables: TableEntity[],
  searchQuery: string
): TableEntity[] {
  const trimmedQuery = searchQuery.trim()
  if (!trimmedQuery) return tables

  const searchTokens = normalizeSearchText(trimmedQuery)
  if (searchTokens.length === 0) return tables

  return tables.filter(
    (table) =>
      matchesSearch(table.displayName, searchTokens) ||
      matchesSearch(table.logicalName, searchTokens)
  )
}
