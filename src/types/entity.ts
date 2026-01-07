// Entity/Table metadata types for Power Platform

export interface EntityMetadata {
  logicalName: string
  displayName: string
  objectTypeCode: number
  description?: string
  isCustomEntity: boolean
  isManaged: boolean
  columns: ColumnMetadata[]
}

export interface ColumnMetadata {
  logicalName: string
  displayName: string
  attributeType: AttributeType
  description?: string
  isCustomAttribute: boolean
  isPrimaryId: boolean
  isPrimaryName: boolean
  isRequired: boolean
  maxLength?: number
  options?: PicklistOption[]
  targets?: string[] // For lookup types
}

export interface PicklistOption {
  value: number
  label: string
  color?: string
}

export type AttributeType =
  | "String"
  | "Memo"
  | "Integer"
  | "BigInt"
  | "Decimal"
  | "Double"
  | "Money"
  | "Boolean"
  | "DateTime"
  | "Lookup"
  | "Picklist"
  | "State"
  | "Status"
  | "Owner"
  | "Customer"
  | "Uniqueidentifier"
  | "Virtual"
  | "Image"
  | "File"
  | "MultiSelectPicklist"

export interface TableFilter {
  searchTerm: string
  tableType: "all" | "custom" | "system"
}
