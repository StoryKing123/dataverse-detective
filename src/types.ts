// 表结构类型定义
export interface TableColumn {
  displayName: string
  logicalName: string
  type: string
  maxLength?: number
  requirement: 'System' | 'Required' | 'Optional'
  isPrimaryKey?: boolean
  optionCount?: number
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
