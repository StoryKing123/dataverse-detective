/**
 * Dataverse Web API 服务层
 * 负责所有与 Dataverse API 的交互
 */

import type { TableEntity, TableColumn } from '../types'
import type {
  DataverseEntity,
  DataverseAttribute,
  DataverseEntitiesResponse,
  DataverseAttributesResponse,
} from './types'
import {
  DATAVERSE_API_BASE_PATH,
  API_TIMEOUT,
  ATTRIBUTE_TYPE_MAP,
  REQUIRED_LEVEL_MAP,
  ERROR_MESSAGES,
} from '../constants/dataverse.constants'

type RetrieveCurrentOrganizationResponse = {
  '@odata.context'?: string
  Detail?: {
    EnvironmentId?: string
    environmentId?: string
  } | null
  detail?: {
    EnvironmentId?: string
    environmentId?: string
  } | null
}

/**
 * 获取 DisplayName 的辅助函数
 * 处理 null 或缺失的 DisplayName 情况
 */
function getDisplayName(displayName: DataverseEntity['DisplayName'] | DataverseAttribute['DisplayName']): string {
  if (!displayName) return 'Unknown'
  if (displayName.UserLocalizedLabel?.Label) {
    return displayName.UserLocalizedLabel.Label
  }
  if (displayName.LocalizedLabels && displayName.LocalizedLabels.length > 0) {
    return displayName.LocalizedLabels[0].Label
  }
  return 'Unknown'
}

function getOptionLabel(label: unknown): string {
  if (!label || typeof label !== 'object') return 'Unknown'
  const typed = label as { UserLocalizedLabel?: { Label: string } | null; LocalizedLabels?: Array<{ Label: string }> }
  if (typed.UserLocalizedLabel?.Label) return typed.UserLocalizedLabel.Label
  if (typed.LocalizedLabels && typed.LocalizedLabels.length > 0) return typed.LocalizedLabels[0].Label
  return 'Unknown'
}

/**
 * 映射 AttributeType 到简化类型
 */
function mapAttributeType(attributeType: string): string {
  return ATTRIBUTE_TYPE_MAP[attributeType] || attributeType
}

/**
 * 映射 RequiredLevel 到应用类型
 */
function mapRequiredLevel(requiredLevelValue: string): 'System' | 'Required' | 'Optional' {
  return REQUIRED_LEVEL_MAP[requiredLevelValue] || 'Optional'
}

/**
 * 映射 Dataverse 实体响应到应用 TableEntity 类型
 */
function mapEntityResponse(entity: DataverseEntity): TableEntity {
  return {
    displayName: getDisplayName(entity.DisplayName),
    logicalName: entity.LogicalName,
    objectTypeCode: entity.ObjectTypeCode,
    isCustomEntity: entity.IsCustomEntity,
    columns: [], // 初始不包含 columns，懒加载时再填充
  }
}

/**
 * 映射 Dataverse 属性响应到应用 TableColumn 类型
 */
function mapAttributeResponse(attribute: DataverseAttribute): TableColumn {
  const column: TableColumn = {
    displayName: getDisplayName(attribute.DisplayName),
    logicalName: attribute.LogicalName,
    type: mapAttributeType(attribute.AttributeType),
    requirement: mapRequiredLevel(attribute.RequiredLevel.Value),
  }

  if (attribute.Targets && attribute.Targets.length > 0) {
    column.lookupTargets = attribute.Targets
  }

  // 添加 MaxLength（仅 String/Memo 类型）
  if (attribute.MaxLength !== undefined) {
    column.maxLength = attribute.MaxLength
  }

  // 添加主键标识
  if (attribute.IsPrimaryId) {
    column.isPrimaryKey = true
  }

  // 添加 OptionSet 选项数量（Picklist/State/Status 类型）
  const optionSet = attribute.OptionSet || attribute.GlobalOptionSet
  if (optionSet?.Options) {
    const options = optionSet.Options
      .map((option) => {
        const resolvedLabel = getOptionLabel(option.Label)
        return {
          value: option.Value,
          label: resolvedLabel === 'Unknown' ? String(option.Value) : resolvedLabel,
        }
      })
      .filter((option) => Number.isFinite(option.value))

    column.optionCount = options.length
    if (options.length > 0) {
      column.options = options
    }
  }

  return column
}

function getChoiceMetadataCast(attributeType: string): string | null {
  switch (attributeType) {
    case 'Picklist':
      return 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata'
    case 'State':
      return 'Microsoft.Dynamics.CRM.StateAttributeMetadata'
    case 'Status':
      return 'Microsoft.Dynamics.CRM.StatusAttributeMetadata'
    case 'MultiSelectPicklist':
      return 'Microsoft.Dynamics.CRM.MultiSelectPicklistAttributeMetadata'
    default:
      return null
  }
}

export async function fetchChoiceOptions(
  entityLogicalName: string,
  attributeLogicalName: string,
  attributeType: string
): Promise<NonNullable<TableColumn['options']>> {
  const encodedEntity = encodeURIComponent(entityLogicalName)
  const encodedAttribute = encodeURIComponent(attributeLogicalName)

  const cast = getChoiceMetadataCast(attributeType)
  const base = `${DATAVERSE_API_BASE_PATH}/EntityDefinitions(LogicalName='${encodedEntity}')/Attributes(LogicalName='${encodedAttribute}')`
  const expand = '$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)'
  const select = '$select=LogicalName,OptionSet,GlobalOptionSet'

  const candidates = [
    cast ? `${base}/${cast}?${select}&${expand}` : null,
    `${base}?${select}`,
  ].filter(Boolean) as string[]

  let lastError: unknown = null

  for (const url of candidates) {
    try {
      const response = await fetchWithTimeout(url)
      const data = (await response.json()) as {
        OptionSet?: { Options?: Array<{ Value: number; Label?: unknown }> } | null
        GlobalOptionSet?: { Options?: Array<{ Value: number; Label?: unknown }> } | null
      }

      const optionSet = data.OptionSet ?? data.GlobalOptionSet
      const rawOptions = optionSet?.Options ?? []

      return rawOptions
        .map((option) => {
          const resolvedLabel = getOptionLabel(option.Label)
          return {
            value: option.Value,
            label: resolvedLabel === 'Unknown' ? String(option.Value) : resolvedLabel,
          }
        })
        .filter((option) => Number.isFinite(option.value))
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(handleFetchError(lastError))
}

/**
 * 处理 fetch 错误，返回友好的错误信息
 */
function handleFetchError(error: unknown): string {
  if (error instanceof TypeError) {
    // 网络错误
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  if (error instanceof Error) {
    // 检查是否是超时错误
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return ERROR_MESSAGES.TIMEOUT
    }
    return error.message
  }

  return ERROR_MESSAGES.SERVER_ERROR
}

/**
 * 执行带超时的 fetch 请求
 */
async function fetchWithTimeout(url: string, timeout: number = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    // 检查 HTTP 状态码
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR)
      }
      if (response.status === 404) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND)
      }
      if (response.status >= 500) {
        throw new Error(ERROR_MESSAGES.SERVER_ERROR)
      }
      throw new Error(`HTTP Error: ${response.status}`)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

let cachedEnvironmentId: string | null = null
let environmentIdPromise: Promise<string> | null = null

export async function getEnvironmentId(): Promise<string> {
  if (cachedEnvironmentId) return cachedEnvironmentId

  if (!environmentIdPromise) {
    environmentIdPromise = (async () => {
      const url = `${DATAVERSE_API_BASE_PATH}/RetrieveCurrentOrganization(AccessType='Default')`
      const response = await fetchWithTimeout(url)
      const data: RetrieveCurrentOrganizationResponse = await response.json()

      const environmentId =
        data.Detail?.EnvironmentId ??
        data.Detail?.environmentId ??
        data.detail?.EnvironmentId ??
        data.detail?.environmentId

      if (!environmentId || typeof environmentId !== 'string') {
        throw new Error('Unable to resolve environment id')
      }

      cachedEnvironmentId = environmentId
      return environmentId
    })()

    environmentIdPromise.catch(() => {
      environmentIdPromise = null
    })
  }

  return environmentIdPromise
}

/**
 * 获取所有实体定义列表（不包含列信息）
 * 使用 IsValidForAdvancedFind 过滤，排除系统内部实体
 */
export async function fetchEntities(): Promise<TableEntity[]> {
  try {
    const url = `${DATAVERSE_API_BASE_PATH}/EntityDefinitions?$select=LogicalName,DisplayName,ObjectTypeCode,IsCustomEntity&$filter=IsValidForAdvancedFind eq true`

    const response = await fetchWithTimeout(url)
    const data: DataverseEntitiesResponse = await response.json()

    return data.value.map(mapEntityResponse)
  } catch (error) {
    throw new Error(handleFetchError(error))
  }
}

/**
 * 获取单个实体的列信息（懒加载）
 * 不使用 $select 以获取完整的属性信息（包括 MaxLength、OptionSet 等派生类属性）
 */
export async function fetchEntityColumns(logicalName: string): Promise<TableColumn[]> {
  try {
    const url = `${DATAVERSE_API_BASE_PATH}/EntityDefinitions(LogicalName='${logicalName}')/Attributes`

    const response = await fetchWithTimeout(url)
    const data: DataverseAttributesResponse = await response.json()

    // 过滤并映射属性
    // 排除 Virtual 类型和逻辑属性（IsLogical = true）
    const validAttributes = data.value.filter(attr => {
      // 排除 Virtual 类型的属性（通常是计算字段或名称字段）
      if (attr.AttributeType === 'Virtual') return false
      // 排除逻辑属性（关联字段的名称字段等）
      if (attr.IsLogical) return false
      // 排除 AttributeOf 不为空的属性（这些是其他属性的辅助字段）
      if (attr.AttributeOf) return false
      return true
    })

    return validAttributes.map(mapAttributeResponse)
  } catch (error) {
    throw new Error(handleFetchError(error))
  }
}
