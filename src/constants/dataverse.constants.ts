/**
 * Dataverse Web API 常量配置
 */

// API 基础路径
export const DATAVERSE_API_BASE_PATH = '/api/data/v9.2'

// 请求超时时间（毫秒）
export const API_TIMEOUT = 30000

/**
 * AttributeType 到简化类型的映射
 * 将 Dataverse 的详细类型映射到应用中使用的简化类型
 */
export const ATTRIBUTE_TYPE_MAP: Record<string, string> = {
  'String': 'String',
  'Memo': 'String',
  'Integer': 'Integer',
  'BigInt': 'BigInt',
  'Decimal': 'Decimal',
  'Double': 'Double',
  'Money': 'Money',
  'DateTime': 'DateTime',
  'Boolean': 'Boolean',
  'Lookup': 'Lookup',
  'Customer': 'Lookup',
  'Owner': 'Owner',
  'Picklist': 'Picklist',
  'State': 'State',
  'Status': 'Status',
  'MultiSelectPicklist': 'MultiSelectPicklist',
  'Uniqueidentifier': 'Uniqueidentifier',
  'Virtual': 'Virtual',
  'EntityName': 'EntityName',
  'ManagedProperty': 'ManagedProperty',
  'Image': 'Image',
  'PartyList': 'PartyList',
  'CalendarRules': 'CalendarRules'
}

/**
 * RequiredLevel 值到应用类型的映射
 */
export const REQUIRED_LEVEL_MAP: Record<string, 'System' | 'Required' | 'Optional'> = {
  'SystemRequired': 'System',
  'ApplicationRequired': 'Required',
  'None': 'Optional'
}

/**
 * 错误消息映射
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to Dataverse',
  AUTH_ERROR: 'Authentication required',
  NOT_FOUND: 'Entity not found',
  SERVER_ERROR: 'Server error, please try again',
  TIMEOUT: 'Request timeout'
}
