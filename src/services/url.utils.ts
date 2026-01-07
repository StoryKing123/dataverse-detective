/**
 * URL 构建工具函数
 * 用于生成 Dynamics 365 和 Power Apps 的跳转链接
 */

/**
 * 构建 Dynamics 365 实体视图 URL
 * 在当前组织环境中打开指定实体的列表视图
 *
 * @param logicalName - 实体的逻辑名称
 * @returns Dynamics 365 视图页面 URL
 */
export function buildViewUrl(logicalName: string): string {
  const orgUrl = window.location.origin
  return `${orgUrl}/main.aspx?pagetype=entitylist&etn=${logicalName}`
}

/**
 * 构建 Power Apps Maker Portal 的实体编辑 URL
 * 打开 Power Apps 门户，用户可以编辑实体定义
 *
 * 目标格式：https://make.powerapps.com/e/{environmentId}/s/{solutionId}/t/{logicalName}
 *
 * @returns Power Apps Maker Portal URL
 */
const DEFAULT_SOLUTION_ID = 'fd140aaf-4df4-11dd-bd17-0019b9312238'

export function buildDataverseEditUrl(params?: {
  environmentId?: string
  solutionId?: string
  logicalName?: string
}): string {
  if (!params?.environmentId || !params.logicalName) {
    return `https://make.powerapps.com/`
  }

  const solutionId = params.solutionId || DEFAULT_SOLUTION_ID
  return `https://make.powerapps.com/e/${params.environmentId}/s/${solutionId}/t/${params.logicalName}`
}
