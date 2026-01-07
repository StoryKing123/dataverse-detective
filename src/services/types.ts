/**
 * Dataverse API 响应类型定义
 */

/**
 * Dataverse EntityDefinitions API 响应中的实体类型
 */
export interface DataverseEntity {
  LogicalName: string
  DisplayName: {
    UserLocalizedLabel: {
      Label: string
    } | null
    LocalizedLabels?: Array<{ Label: string }>
  } | null
  ObjectTypeCode: number
  IsCustomEntity: boolean
}

/**
 * Dataverse Attributes API 响应中的属性类型
 */
export interface DataverseAttribute {
  LogicalName: string
  DisplayName: {
    UserLocalizedLabel: {
      Label: string
    } | null
    LocalizedLabels?: Array<{ Label: string }>
  } | null
  AttributeType: string
  // Lookup/Customer/Owner 这类字段会带 Targets
  Targets?: string[]
  MaxLength?: number
  RequiredLevel: {
    Value: string
  }
  IsPrimaryId: boolean
  // 逻辑属性标识（如关联字段的名称字段）
  IsLogical: boolean
  // 此属性是否是另一个属性的辅助字段（如 lookup 的 name 字段）
  AttributeOf: string | null
  // OptionSet 相关字段（仅 Picklist/State/Status 类型）
  OptionSet?: {
    Options?: Array<{
      Value: number
      Label?: {
        UserLocalizedLabel?: { Label: string } | null
        LocalizedLabels?: Array<{ Label: string }>
      } | null
    }>
  }
  GlobalOptionSet?: {
    Options?: Array<{
      Value: number
      Label?: {
        UserLocalizedLabel?: { Label: string } | null
        LocalizedLabels?: Array<{ Label: string }>
      } | null
    }>
  }
}

/**
 * Dataverse EntityDefinitions API 响应类型
 */
export interface DataverseEntitiesResponse {
  value: DataverseEntity[]
}

/**
 * Dataverse Attributes API 响应类型
 */
export interface DataverseAttributesResponse {
  value: DataverseAttribute[]
}

/**
 * 加载状态枚举
 */
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * 加载状态管理
 * - tables: 表列表的加载状态
 * - columns: 各个表的列加载状态（按 logicalName 索引）
 */
export interface LoadingState {
  tables: LoadingStatus
  columns: Record<string, LoadingStatus>
}

/**
 * 错误状态管理
 * - tables: 表列表的错误信息
 * - columns: 各个表的列错误信息（按 logicalName 索引）
 */
export interface ErrorState {
  tables: string | null
  columns: Record<string, string | null>
}
