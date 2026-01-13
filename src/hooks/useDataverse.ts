/**
 * useDataverse Hook
 * 管理 Dataverse 数据的加载、缓存和状态
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TableEntity, TableColumn, TableRelationship } from '../types'
import type { LoadingState, ErrorState } from '../services/types'
import { fetchEntities, fetchEntityColumns, fetchEntityRelationships } from '../services/dataverse.service'

interface UseDataverseReturn {
  tables: TableEntity[]
  loadingState: LoadingState
  errors: ErrorState
  loadColumns: (logicalName: string) => Promise<void>
  loadRelationships: (logicalName: string) => Promise<void>
  retryLoadTables: () => void
}

/**
 * Dataverse 数据管理 Hook
 * 提供表列表加载、列懒加载、缓存和错误处理功能
 */
export function useDataverse(): UseDataverseReturn {
  // 表数据状态
  const [tables, setTables] = useState<TableEntity[]>([])

  // 加载状态
  const [loadingState, setLoadingState] = useState<LoadingState>({
    tables: 'idle',
    columns: {},
    relationships: {},
  })

  // 错误状态
  const [errors, setErrors] = useState<ErrorState>({
    tables: null,
    columns: {},
    relationships: {},
  })

  // 列数据缓存（避免重复请求）
  const columnsCache = useRef<Map<string, TableColumn[]>>(new Map())
  const relationshipsCache = useRef<Map<string, TableRelationship[]>>(new Map())

  /**
   * 加载所有表列表
   */
  const loadTables = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, tables: 'loading' }))
    setErrors(prev => ({ ...prev, tables: null }))

    try {
      const entities = await fetchEntities()
      setTables(entities)
      setLoadingState(prev => ({ ...prev, tables: 'success' }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tables'
      setErrors(prev => ({ ...prev, tables: errorMessage }))
      setLoadingState(prev => ({ ...prev, tables: 'error' }))
    }
  }, [])

  /**
   * 重试加载表列表
   */
  const retryLoadTables = useCallback(() => {
    loadTables()
  }, [loadTables])

  /**
   * 懒加载指定表的列数据
   * 使用缓存避免重复请求
   */
  const loadColumns = useCallback(async (logicalName: string) => {
    // 检查缓存
    if (columnsCache.current.has(logicalName)) {
      const cachedColumns = columnsCache.current.get(logicalName)!

      // 更新 tables state，填充缓存的 columns
      setTables(prev =>
        prev.map(table =>
          table.logicalName === logicalName
            ? { ...table, columns: cachedColumns }
            : table
        )
      )

      // 标记为已加载，避免上层重复触发
      setLoadingState(prev => ({
        ...prev,
        columns: { ...prev.columns, [logicalName]: 'success' },
      }))
      setErrors(prev => ({
        ...prev,
        columns: { ...prev.columns, [logicalName]: null },
      }))
      return
    }

    // 设置加载状态
    setLoadingState(prev => ({
      ...prev,
      columns: { ...prev.columns, [logicalName]: 'loading' },
    }))
    setErrors(prev => ({
      ...prev,
      columns: { ...prev.columns, [logicalName]: null },
    }))

    try {
      const columns = await fetchEntityColumns(logicalName)

      // 缓存列数据
      columnsCache.current.set(logicalName, columns)

      // 更新 tables state
      setTables(prev =>
        prev.map(table =>
          table.logicalName === logicalName
            ? { ...table, columns }
            : table
        )
      )

      // 更新加载状态
      setLoadingState(prev => ({
        ...prev,
        columns: { ...prev.columns, [logicalName]: 'success' },
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load columns'
      setErrors(prev => ({
        ...prev,
        columns: { ...prev.columns, [logicalName]: errorMessage },
      }))
      setLoadingState(prev => ({
        ...prev,
        columns: { ...prev.columns, [logicalName]: 'error' },
      }))
    }
  }, [])

  const loadRelationships = useCallback(async (logicalName: string) => {
    if (relationshipsCache.current.has(logicalName)) {
      const cachedRelationships = relationshipsCache.current.get(logicalName)!

      setTables(prev =>
        prev.map(table =>
          table.logicalName === logicalName
            ? { ...table, relationships: cachedRelationships }
            : table
        )
      )

      setLoadingState(prev => ({
        ...prev,
        relationships: { ...prev.relationships, [logicalName]: 'success' },
      }))
      setErrors(prev => ({
        ...prev,
        relationships: { ...prev.relationships, [logicalName]: null },
      }))
      return
    }

    setLoadingState(prev => ({
      ...prev,
      relationships: { ...prev.relationships, [logicalName]: 'loading' },
    }))
    setErrors(prev => ({
      ...prev,
      relationships: { ...prev.relationships, [logicalName]: null },
    }))

    try {
      const relationships = await fetchEntityRelationships(logicalName)
      relationshipsCache.current.set(logicalName, relationships)

      setTables(prev =>
        prev.map(table =>
          table.logicalName === logicalName
            ? { ...table, relationships }
            : table
        )
      )

      setLoadingState(prev => ({
        ...prev,
        relationships: { ...prev.relationships, [logicalName]: 'success' },
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load relationships'
      setErrors(prev => ({
        ...prev,
        relationships: { ...prev.relationships, [logicalName]: errorMessage },
      }))
      setLoadingState(prev => ({
        ...prev,
        relationships: { ...prev.relationships, [logicalName]: 'error' },
      }))
    }
  }, [])

  // 组件挂载时加载表列表
  useEffect(() => {
    queueMicrotask(() => {
      void loadTables()
    })
  }, [loadTables])

  return {
    tables,
    loadingState,
    errors,
    loadColumns,
    loadRelationships,
    retryLoadTables,
  }
}
