// 表结构类型定义
export interface TableColumn {
  displayName: string
  logicalName: string
  type: string
  maxLength?: number
  requirement: 'System' | 'Required' | 'Optional'
  isPrimaryKey?: boolean
  optionCount?: number
  options?: Array<{ value: number; label: string }>
  lookupTargets?: string[]
}

export interface TableEntity {
  displayName: string
  logicalName: string
  objectTypeCode: number
  isCustomEntity: boolean
  columns: TableColumn[]
}

// 主题类型
export type Theme = 'light' | 'dark'

// 从 services/types.ts 导出加载和错误状态类型
export type { LoadingState, ErrorState, LoadingStatus } from './services/types'
