/**
 * useUrlParams Hook
 * 解析 URL 查询参数，支持通过 URL 快速定位实体
 */

interface UrlParams {
  logicname?: string
}

/**
 * URL 参数解析 Hook
 * 解析 URL 中的查询参数，例如：?logicname=account
 */
export function useUrlParams(): UrlParams {
  const searchParams = new URLSearchParams(window.location.search)
  const logicname = searchParams.get('logicname') ?? undefined
  return logicname ? { logicname } : {}
}
