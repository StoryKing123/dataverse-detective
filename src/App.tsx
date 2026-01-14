import { useState, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
	  Search,
	  Info,
	  Moon,
	  Sun,
	  LayoutGrid,
	  Maximize2,
	  ChevronRight,
	  Copy,
	  Loader2,
	} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { TableEntity, TableColumn, TableRelationship, Theme } from "./types"
import { useDataverse } from "@/hooks/useDataverse"
import { useUrlParams } from "@/hooks/useUrlParams"
import { buildViewUrl, buildDataverseEditUrl } from "@/services/url.utils"
import { fetchChoiceOptions, getEnvironmentId } from "@/services/dataverse.service"
import { MermaidDiagram } from "@/components/MermaidDiagram"
import { buildMermaidErDiagram } from "@/lib/mermaidEr"
import { ErDiagramModal } from "@/components/ErDiagramModal"

const TABLE_LIST_RENDER_LIMIT = 200

function App() {
  // 主题状态
  const [theme, setTheme] = useState<Theme>("light")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null)
  const [activeTab, setActiveTab] = useState<"columns" | "relationships">("columns")
  const [columnSearch, setColumnSearch] = useState("")
  const [relationshipSearch, setRelationshipSearch] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // 使用 Dataverse Hook 获取数据
  const { tables, loadingState, errors, loadColumns, loadRelationships, retryLoadTables } = useDataverse()

  // 解析 URL 参数
  const { logicname } = useUrlParams()

  // 主题切换
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

	  // URL 参数自动选择表
	  useEffect(() => {
	    if (logicname && tables.length > 0) {
	      const targetTable = tables.find(
	        (t) => t.logicalName.toLowerCase() === logicname.toLowerCase()
	      )
	
	      if (targetTable) {
	        queueMicrotask(() => {
            setSelectedTable(targetTable)
            setRelationshipSearch("")
            setColumnSearch("")
            void loadColumns(targetTable.logicalName)
          })
	      }
	    }
	  }, [logicname, loadColumns, tables])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  // 过滤表列表
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables
    const query = searchQuery.toLowerCase()
    return tables.filter(
      (t) =>
        t.displayName.toLowerCase().includes(query) ||
        t.logicalName.toLowerCase().includes(query)
    )
  }, [searchQuery, tables])

  const visibleTables = useMemo(
    () => filteredTables.slice(0, TABLE_LIST_RENDER_LIMIT),
    [filteredTables]
  )

  const isTableListCapped = filteredTables.length > TABLE_LIST_RENDER_LIMIT

  // 获取当前选中的 table 的最新数据（包含已加载的 columns）
  const currentTable = useMemo(() => {
    if (!selectedTable) return null
    return tables.find(t => t.logicalName === selectedTable.logicalName) || selectedTable
  }, [selectedTable, tables])

  const tableDisplayNameByLogicalName = useMemo(() => {
    const result: Record<string, string> = {}
    for (const table of tables) {
      result[table.logicalName.toLowerCase()] = table.displayName
    }
    return result
  }, [tables])

  const tableIsCustomByLogicalName = useMemo(() => {
    const result: Record<string, boolean> = {}
    for (const table of tables) {
      result[table.logicalName.toLowerCase()] = table.isCustomEntity
    }
    return result
  }, [tables])

  // 过滤列
  const filteredColumns = useMemo(() => {
    if (!currentTable) return []

    if (!columnSearch.trim()) return currentTable.columns
    const query = columnSearch.toLowerCase()
    return currentTable.columns.filter(
      (c) =>
        c.displayName.toLowerCase().includes(query) ||
        c.logicalName.toLowerCase().includes(query) ||
        c.lookupTargets?.some(t => t.toLowerCase().includes(query))
    )
  }, [currentTable, columnSearch])

  const filteredRelationships = useMemo(() => {
    if (!currentTable) return []
    const relationships = currentTable.relationships ?? []
    if (!relationshipSearch.trim()) return relationships
    const query = relationshipSearch.toLowerCase()
    return relationships.filter((relationship) => {
      const relatedDisplayName =
        tableDisplayNameByLogicalName[relationship.relatedTableLogicalName.toLowerCase()] ?? ""

      return (
        relationship.schemaName.toLowerCase().includes(query) ||
        relationship.relatedTableLogicalName.toLowerCase().includes(query) ||
        relatedDisplayName.toLowerCase().includes(query) ||
        relationship.referencingAttribute?.toLowerCase().includes(query) ||
        relationship.referencedAttribute?.toLowerCase().includes(query) ||
        relationship.intersectEntityName?.toLowerCase().includes(query)
      )
    })
  }, [currentTable, relationshipSearch, tableDisplayNameByLogicalName])

  const currentRelationshipsStatus = currentTable ? loadingState.relationships[currentTable.logicalName] : undefined

  const selectTable = (table: TableEntity) => {
    setSelectedTable(table)
    setRelationshipSearch("")
    setColumnSearch("")
    void loadColumns(table.logicalName)
  }

  useEffect(() => {
    if (!currentTable) return
    const logicalName = currentTable.logicalName

    if (activeTab !== "relationships") return
    if (currentRelationshipsStatus === "loading" || currentRelationshipsStatus === "success") return
    void loadRelationships(logicalName)
  }, [
    activeTab,
    currentRelationshipsStatus,
    currentTable,
    loadRelationships,
  ])

  // 复制到剪贴板
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <LayoutGrid className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-lg font-semibold">
            <span className="text-violet-600 dark:text-violet-400">Dataverse</span>{" "}
            <span className="text-foreground">Detective</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
        >
          <AnimatePresence mode="wait">
            {theme === "light" ? (
              <motion.div
                key="moon"
                initial={false}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={false}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex min-h-0 w-[400px] shrink-0 flex-col border-r border-border bg-background">
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Table Search
              </span>
              <Badge variant="secondary" className="h-5 min-w-[20px] justify-center px-1.5 text-[10px]">
                {filteredTables.length}
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {isTableListCapped && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
                <Info className="mt-[1px] h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {searchQuery.trim()
                    ? `Showing first ${TABLE_LIST_RENDER_LIMIT} matching tables. Refine your search to narrow results.`
                    : `Showing first ${TABLE_LIST_RENDER_LIMIT} of ${filteredTables.length} tables. Use search to find more.`}
                </span>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {/* 加载状态 */}
            {loadingState.tables === 'loading' && (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">Loading tables...</div>
              </div>
            )}

            {/* 错误状态 */}
            {errors.tables && (
              <div className="m-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="mb-2 text-sm text-destructive">{errors.tables}</p>
                <Button size="sm" variant="outline" onClick={retryLoadTables}>
                  Retry
                </Button>
              </div>
            )}

            {/* 表列表 */}
            {loadingState.tables === 'success' && (
              <AnimatePresence mode="popLayout">
                {visibleTables.map((table, index) => {
                const isSelected = selectedTable?.logicalName === table.logicalName
                return (
                  <motion.button
                    key={table.logicalName}
                    layout="position"
                    initial={false}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.15, delay: Math.min(index, 20) * 0.02 },
                    }}
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.1 } }}
                    onClick={() => {
                      selectTable(table)
                    }}
                    className={cn(
                      "group relative flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                      isSelected
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isSelected
                          ? "text-accent-foreground"
                          : "text-foreground"
                      )}
                    >
                      {table.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {table.logicalName}
                    </span>
                  </motion.button>
                )
              })}
              </AnimatePresence>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {!currentTable ? (
              <EmptyState key="empty" tableCount={tables.length} />
            ) : (
              <TableDetail
                key={currentTable.logicalName}
                table={currentTable}
                theme={theme}
                columnSearch={columnSearch}
                setColumnSearch={setColumnSearch}
                filteredColumns={filteredColumns}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                relationshipSearch={relationshipSearch}
                setRelationshipSearch={setRelationshipSearch}
                filteredRelationships={filteredRelationships}
                tableDisplayNameByLogicalName={tableDisplayNameByLogicalName}
                tableIsCustomByLogicalName={tableIsCustomByLogicalName}
                openTableByLogicalName={(logicalName) => {
                  const targetTable = tables.find((t) => t.logicalName.toLowerCase() === logicalName.toLowerCase())
                  if (targetTable) {
                    selectTable(targetTable)
                  }
                }}
                copyToClipboard={copyToClipboard}
                copiedField={copiedField}
                isLoadingColumns={loadingState.columns[currentTable.logicalName] === 'loading'}
                columnError={errors.columns[currentTable.logicalName]}
                isLoadingRelationships={loadingState.relationships[currentTable.logicalName] === 'loading'}
                relationshipError={errors.relationships[currentTable.logicalName]}
                retryRelationships={() => void loadRelationships(currentTable.logicalName)}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// 空状态组件
function EmptyState({ tableCount }: { tableCount: number }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="empty-state-frosted flex h-full items-center justify-center"
    >
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
        >
          <LayoutGrid className="h-10 w-10 text-violet-500" />
        </motion.div>

        <motion.h1
          initial={false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-3 text-3xl font-bold text-foreground"
        >
          Entity Metadata Explorer
        </motion.h1>

        <motion.p
          initial={false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-10 max-w-md text-center text-muted-foreground"
        >
          Select a table from the sidebar to inspect its schema, verify data types, and access deep links to Dynamics 365 views.
        </motion.p>

        <motion.div
          initial={false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex gap-4"
        >
          <div className="flex flex-col items-center rounded-xl border border-border bg-card px-10 py-5 text-card-foreground shadow-sm">
            <span className="text-2xl font-bold text-foreground">
              {tableCount}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tables Indexed
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-border bg-card px-10 py-5 text-card-foreground shadow-sm">
            <span className="text-2xl font-bold text-foreground">
              Instant
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Search
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// 表详情组件
interface TableDetailProps {
  table: TableEntity
  theme: Theme
  columnSearch: string
  setColumnSearch: (value: string) => void
  filteredColumns: TableColumn[]
  activeTab: "columns" | "relationships"
  setActiveTab: (tab: "columns" | "relationships") => void
  relationshipSearch: string
  setRelationshipSearch: (value: string) => void
  filteredRelationships: TableRelationship[]
  tableDisplayNameByLogicalName: Record<string, string>
  tableIsCustomByLogicalName: Record<string, boolean>
  openTableByLogicalName: (logicalName: string) => void
  copyToClipboard: (text: string, field: string) => void
  copiedField: string | null
  isLoadingColumns: boolean
  columnError: string | null | undefined
  isLoadingRelationships: boolean
  relationshipError: string | null | undefined
  retryRelationships: () => void
}

function TableDetail({
  table,
  theme,
  columnSearch,
  setColumnSearch,
  filteredColumns,
  activeTab,
  setActiveTab,
  relationshipSearch,
  setRelationshipSearch,
  filteredRelationships,
  tableDisplayNameByLogicalName,
  tableIsCustomByLogicalName,
  openTableByLogicalName,
  copyToClipboard,
  copiedField,
  isLoadingColumns,
  columnError,
  isLoadingRelationships,
  relationshipError,
  retryRelationships,
	}: TableDetailProps) {
    const [dataverseEditError, setDataverseEditError] = useState<string | null>(null)
    const [expandedChoiceColumns, setExpandedChoiceColumns] = useState<Set<string>>(() => new Set())
    const [choiceOptionsState, setChoiceOptionsState] = useState<
      Record<string, { status: "idle" | "loading" | "success" | "error"; options: Array<{ value: number; label: string }>; error: string | null }>
    >({})
    // 跟踪正在进行的请求，避免重复加载
    const loadingRequestsRef = useRef<Set<string>>(new Set())

	  const primaryKey = useMemo(() => {
	    const pk = table.columns.find((c) => c.isPrimaryKey)?.logicalName
	    return pk ?? "—"
	  }, [table.columns])

    const relationshipCounts = useMemo(() => {
      const counts = { OneToMany: 0, ManyToOne: 0, ManyToMany: 0 }
      for (const rel of table.relationships ?? []) {
        if (rel.kind === "OneToMany") counts.OneToMany += 1
        else if (rel.kind === "ManyToOne") counts.ManyToOne += 1
        else if (rel.kind === "ManyToMany") counts.ManyToMany += 1
      }
      return counts
    }, [table.relationships])

    const isChoiceType = (type: string) =>
      type === "Picklist" || type === "State" || type === "Status" || type === "MultiSelectPicklist"

    const ensureChoiceOptionsLoaded = async (column: TableColumn) => {
      if (!isChoiceType(column.type)) return
      if (column.options?.length) return

      // 使用 ref 检查是否已经在加载中
      if (loadingRequestsRef.current.has(column.logicalName)) {
        return
      }

      // 检查状态
      const currentState = choiceOptionsState[column.logicalName]
      if (currentState?.status === "loading" || currentState?.status === "success") {
        return
      }

      // 标记为正在加载
      loadingRequestsRef.current.add(column.logicalName)

      // 设置 loading 状态
      setChoiceOptionsState((prev) => ({
        ...prev,
        [column.logicalName]: { status: "loading", options: [], error: null },
      }))

      try {
        const options = await fetchChoiceOptions(table.logicalName, column.logicalName, column.type)
        setChoiceOptionsState((prev) => ({
          ...prev,
          [column.logicalName]: { status: "success", options, error: null },
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load choices"
        setChoiceOptionsState((prev) => ({
          ...prev,
          [column.logicalName]: { status: "error", options: [], error: message },
        }))
      } finally {
        // 无论成功还是失败，都移除加载标记
        loadingRequestsRef.current.delete(column.logicalName)
      }
    }

    const toggleChoiceColumn = (logicalName: string) => {
      setExpandedChoiceColumns((prev) => {
        const next = new Set(prev)
        if (next.has(logicalName)) next.delete(logicalName)
        else next.add(logicalName)
        return next
      })
    }

    const handleEditInDataverse = async () => {
      setDataverseEditError(null)

      try {
        const environmentId = await getEnvironmentId()
        const url = buildDataverseEditUrl({ environmentId, logicalName: table.logicalName })
        const opened = window.open(url, "_blank")
        if (!opened) {
          setDataverseEditError("Popup blocked by your browser. Please allow popups for this site and try again.")
        }
      } catch(err) {
        console.error(err)
        setDataverseEditError(
          "Failed to open Dataverse. Please make sure you are signed in and have access to this environment, then try again."
        )
      }
    }

		  return (
		    <motion.div
		      initial={false}
		      animate={{ opacity: 1, x: 0 }}
		      exit={{ opacity: 0, x: -20 }}
		      transition={{ duration: 0.3 }}
		      className="scrollbar-gutter-stable h-full overflow-y-auto bg-background px-10 py-8"
		    >
	      {/* Header */}
	      <div className="flex items-start justify-between gap-8 border-b border-border pb-6">
	        <div className="min-w-0">
	          <h2 className="text-4xl font-semibold leading-tight text-foreground">
	            {table.displayName}
	          </h2>
	          <button
	            onClick={() => copyToClipboard(table.logicalName, "logicalName")}
	            className="mt-1 inline-flex items-center gap-2 truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
	            title="Click to copy"
	          >
	            <span className="truncate font-mono">{table.logicalName}</span>
	            {copiedField === "logicalName" && (
	              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
	                Copied
	              </span>
	            )}
	          </button>

	          <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4">
	            <div className="flex flex-col gap-1">
	              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
	                Primary Key
	              </span>
	              <span className="font-mono text-sm text-foreground">{primaryKey}</span>
	            </div>
	            <div className="flex flex-col gap-1">
	              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
	                Object Type Code
	              </span>
	              <span className="font-mono text-sm text-foreground">{table.objectTypeCode}</span>
	            </div>
	            <div className="flex flex-col gap-1">
	              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
	                Total Columns
	              </span>
	              <span className="font-mono text-sm text-foreground">{table.columns.length}</span>
	            </div>
	            {table.isCustomEntity && (
	              <Badge variant="secondary" className="h-6">
	                Custom Entity
	              </Badge>
	            )}
	          </div>
	        </div>

	        <div className="flex shrink-0 gap-2">
	          <Button
	            size="sm"
	            variant="outline"
	            onClick={() => window.open(buildViewUrl(table.logicalName), "_blank")}
	          >
	            Open View
	          </Button>
			          <Button
			            size="sm"
			            onClick={() => void handleEditInDataverse()}
			          >
			            Edit in Dataverse
			          </Button>
			        </div>
			      </div>

          {dataverseEditError && (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertTitle>Unable to open Dataverse</AlertTitle>
                <AlertDescription>{dataverseEditError}</AlertDescription>
              </Alert>
            </div>
          )}

        {/* Section header + minimal tab switch */}
        <div className="mt-6 flex items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                {activeTab === "columns" ? "Columns" : "Relationships"}
              </h3>
              <span className="text-sm text-muted-foreground">
                {(activeTab === "columns" ? filteredColumns.length : filteredRelationships.length)}{" "}
                visible
              </span>

              <button
                type="button"
                onClick={() => {
                  const nextTab = activeTab === "columns" ? "relationships" : "columns"
                  setActiveTab(nextTab)
                  if (nextTab === "relationships") {
                    retryRelationships()
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
              >
                {activeTab === "columns" ? "Relationships" : "Columns"}
              </button>
            </div>
          </div>

          <div className="w-72">
            {activeTab === "columns" ? (
              <Input
                placeholder="Search columns..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
              />
            ) : (
              <Input
                placeholder="Search relationships..."
                value={relationshipSearch}
                onChange={(e) => setRelationshipSearch(e.target.value)}
              />
            )}
          </div>
        </div>

        {activeTab === "columns" ? (
          <div className="mt-4">
	          {/* 列加载状态 */}
	          {isLoadingColumns && (
	            <div className="flex items-center justify-center p-10">
	              <div className="text-sm text-muted-foreground">Loading columns...</div>
	            </div>
	          )}

	          {/* 列错误状态 */}
	          {columnError && !isLoadingColumns && (
	            <div className="my-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
	              <p className="text-sm text-destructive">{columnError}</p>
	            </div>
	          )}

	          {/* 列数据表格 */}
	          {!isLoadingColumns && !columnError && (
	            <div className="overflow-x-auto">
	              <table className="w-full text-[13px] leading-5">
	                <thead>
	                  <tr className="border-b border-border">
	                    <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
	                      <div className="flex items-center gap-2">
	                        <div className="h-7 w-7 shrink-0" />
	                        <span>Display Name</span>
	                      </div>
	                    </th>
	                    <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
	                      <span className="pl-1.5">Logical Name</span>
	                    </th>
	                    <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
	                      Type
	                    </th>
	                    <th className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
	                      Requirement
	                    </th>
	                  </tr>
	                </thead>
	                <tbody className="divide-y divide-border">
	                  <AnimatePresence initial={false}>
	                    {filteredColumns.flatMap((column) => {
                        const isChoice = isChoiceType(column.type)
                        const choiceState = choiceOptionsState[column.logicalName]
                        const resolvedOptions = choiceState?.options?.length ? choiceState.options : column.options
                        const isExpanded = isChoice && expandedChoiceColumns.has(column.logicalName)
                        const isLoadingChoices = isChoice && choiceState?.status === "loading"
                        const choicesCount = resolvedOptions?.length ?? 0

	                        const row = (
	                          <motion.tr
	                            key={`${column.logicalName}__row`}
	                            initial={false}
	                            animate={{ opacity: 1 }}
	                            exit={{ opacity: 0 }}
	                            transition={{ duration: 0.15 }}
	                            className={cn(
	                              "group transition-colors hover:bg-muted/30",
                              isExpanded && "bg-muted/20 hover:bg-muted/20"
                            )}
                          >
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleChoiceColumn(column.logicalName)
                                    if (!isExpanded) {
                                      void ensureChoiceOptionsLoaded(column)
                                    }
                                  }}
                                  aria-label={isChoice ? "Toggle options" : undefined}
                                  aria-expanded={isChoice ? isExpanded : undefined}
                                  disabled={!isChoice}
                                  className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                                    !isChoice && "pointer-events-none opacity-0"
                                  )}
                                >
                                  {isLoadingChoices ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ChevronRight
                                      className={cn(
                                        "h-4 w-4 transition-transform duration-200",
                                        isExpanded && "rotate-90"
                                      )}
                                    />
                                  )}
                                </button>

                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {column.displayName}
                                  </span>
                                  {isChoice && (
                                    <Badge
                                      variant="outline"
                                      className="h-5 px-2 py-0 text-[10px]"
                                    >
                                      {choiceState?.status === "success" ? `${choicesCount} Options` : "Options"}
                                    </Badge>
                                  )}
                                  {column.isPrimaryKey && (
                                    <Badge
                                      variant="secondary"
                                      className="h-5 px-2 py-0 text-[10px]"
                                    >
                                      Primary Key
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => void copyToClipboard(column.logicalName, `column:${column.logicalName}`)}
                                className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted"
                                title="Click to copy"
                              >
                                <span className="font-mono text-xs text-muted-foreground">
                                  {column.logicalName}
                                </span>
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                {copiedField === `column:${column.logicalName}` && (
                                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                    Copied
                                  </span>
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {column.type}
                                </span>
                                {column.lookupTargets && column.lookupTargets.length > 0 && (
                                  <span className="text-[11px] text-muted-foreground">
                                    → {column.lookupTargets.join(", ")}
                                  </span>
                                )}
                                {column.maxLength && (
                                  <Badge
                                    variant="secondary"
                                    className="h-5 px-2 py-0 text-[10px]"
                                  >
                                    {column.maxLength}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Badge
                                variant={
                                  column.requirement === "System"
                                    ? "system"
                                    : column.requirement === "Required"
                                    ? "required"
                                    : "optional"
                                }
                                className="h-5 px-2 py-0 text-[11px]"
                              >
                                {column.requirement}
                              </Badge>
                            </td>
                          </motion.tr>
                        )

                        const detailsRow =
	                          isChoice && isExpanded ? (
	                            <motion.tr
	                              key={`${column.logicalName}__options`}
	                              initial={false}
	                              animate={{ opacity: 1 }}
	                              exit={{ opacity: 0 }}
	                              transition={{ duration: 0.15 }}
	                              className="bg-background"
	                            >
	                              <td colSpan={4} className="px-3 pb-4 pt-0">
	                                <motion.div
	                                  initial={false}
	                                  animate={{ height: "auto", opacity: 1 }}
	                                  exit={{ height: 0, opacity: 0 }}
	                                  transition={{ duration: 0.2, ease: "easeOut" }}
	                                  className="overflow-hidden"
	                                >
                                  <div className="p-3">
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          Choices
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                          {choiceState?.status === "success" ? `${choicesCount} total` : "Loading…"}
                                        </span>
                                      </div>
                                    </div>

                                    {choiceState?.status === "error" ? (
                                      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                                        <span className="text-sm text-destructive">
                                          {choiceState.error ?? "Failed to load choices"}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => void ensureChoiceOptionsLoaded(column)}
                                        >
                                          Retry
                                        </Button>
                                      </div>
                                    ) : choiceState?.status === "loading" ? (
                                      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading choices...
                                      </div>
                                    ) : (
                                      <div className="max-h-64 overflow-y-auto">
                                        {choicesCount === 0 ? (
                                          <div className="rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm text-muted-foreground">
                                            No choices available.
                                          </div>
                                        ) : (
                                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {(resolvedOptions ?? []).map((option) => (
                                              <div
                                                key={option.value}
                                                className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-background px-4 py-2 shadow-sm transition-colors hover:bg-muted/15"
                                              >
                                                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                                                  {option.label}
                                                </span>
                                                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                                                  {option.value}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </td>
                            </motion.tr>
                          ) : null

                        return [row, detailsRow].filter(Boolean)
                      })}
	                  </AnimatePresence>
	                </tbody>
	              </table>
	            </div>
	          )}
	        </div>
        ) : (
          <RelationshipsPanel
            tableLogicalName={table.logicalName}
            relationships={filteredRelationships}
            allRelationships={table.relationships ?? []}
            tableColumns={table.columns}
            relationshipCounts={relationshipCounts}
            displayNameByLogicalName={tableDisplayNameByLogicalName}
            isCustomByLogicalName={tableIsCustomByLogicalName}
            openTableByLogicalName={openTableByLogicalName}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
            theme={theme}
            isLoading={isLoadingRelationships}
            error={relationshipError}
            onRetry={retryRelationships}
          />
        )}
	    </motion.div>
	  )
	}

function RelationshipKindBadge({ kind }: { kind: TableRelationship["kind"] }) {
  if (kind === "OneToMany") return <Badge variant="success">1:N</Badge>
  if (kind === "ManyToOne") return <Badge variant="warning">N:1</Badge>
  return <Badge variant="secondary">N:N</Badge>
}

function RelationshipRow({
  relationship,
  resolveDisplayName,
  openTableByLogicalName,
  copyToClipboard,
  copiedField,
}: {
  relationship: TableRelationship
  resolveDisplayName: (logicalName: string) => string
  openTableByLogicalName: (logicalName: string) => void
  copyToClipboard: (text: string, field: string) => void
  copiedField: string | null
}) {
  const relatedDisplayName = resolveDisplayName(relationship.relatedTableLogicalName)
  const showLookupLabel =
    relationship.kind === "OneToMany"
      ? "Lookup column (on related table)"
      : relationship.kind === "ManyToOne"
        ? "Lookup column (on this table)"
        : null

  const lookupValue =
    relationship.kind === "ManyToMany"
      ? relationship.intersectEntityName
      : relationship.referencingAttribute

  const lookupSecondary =
    relationship.kind === "ManyToMany"
      ? "Intersect table"
      : relationship.referencedAttribute
        ? `→ ${relationship.referencedAttribute}`
        : null

  const schemaCopyKey = `relationship:schema:${relationship.schemaName}`

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card/30 px-4 py-3 shadow-sm transition-colors hover:bg-muted/20">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {relatedDisplayName}
            </div>
            <div className="truncate font-mono text-xs text-muted-foreground">
              {relationship.relatedTableLogicalName}
            </div>
          </div>
          <RelationshipKindBadge kind={relationship.kind} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 font-semibold uppercase tracking-wider text-muted-foreground">
              Schema
            </span>
            <span className="truncate font-mono text-foreground">{relationship.schemaName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 font-semibold uppercase tracking-wider text-muted-foreground">
              {showLookupLabel ?? "Details"}
            </span>
            <span className="truncate font-mono text-foreground">
              {lookupValue ?? "—"}
              {lookupSecondary ? (
                <span className="ml-2 text-muted-foreground">{lookupSecondary}</span>
              ) : null}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => openTableByLogicalName(relationship.relatedTableLogicalName)}
        >
          Open
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => void copyToClipboard(relationship.schemaName, schemaCopyKey)}
          title="Copy schema name"
        >
          <Copy className="h-4 w-4" />
        </Button>
        {copiedField === schemaCopyKey && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Copied
          </span>
        )}
      </div>
    </div>
  )
}

function RelationshipSection({
  title,
  subtitle,
  items,
  resolveDisplayName,
  openTableByLogicalName,
  copyToClipboard,
  copiedField,
}: {
  title: string
  subtitle: string
  items: TableRelationship[]
  resolveDisplayName: (logicalName: string) => string
  openTableByLogicalName: (logicalName: string) => void
  copyToClipboard: (text: string, field: string) => void
  copiedField: string | null
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="text-sm text-muted-foreground">
            {items.length} {subtitle}
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
          No items in this group.
        </div>
      ) : (
        <div className="grid gap-3">
          {items
            .slice()
            .sort((a, b) =>
              resolveDisplayName(a.relatedTableLogicalName).localeCompare(
                resolveDisplayName(b.relatedTableLogicalName)
              )
            )
            .map((relationship) => (
              <RelationshipRow
                key={`${relationship.kind}:${relationship.schemaName}:${relationship.relatedTableLogicalName}`}
                relationship={relationship}
                resolveDisplayName={resolveDisplayName}
                openTableByLogicalName={openTableByLogicalName}
                copyToClipboard={copyToClipboard}
                copiedField={copiedField}
              />
            ))}
        </div>
      )}
    </div>
  )
}

function RelationshipsPanel({
  tableLogicalName,
  relationships,
  allRelationships,
  tableColumns,
  relationshipCounts,
  displayNameByLogicalName,
  isCustomByLogicalName,
  openTableByLogicalName,
  copyToClipboard,
  copiedField,
  theme,
  isLoading,
  error,
  onRetry,
}: {
  tableLogicalName: string
  relationships: TableRelationship[]
  allRelationships: TableRelationship[]
  tableColumns: TableColumn[]
  relationshipCounts: { OneToMany: number; ManyToOne: number; ManyToMany: number }
  displayNameByLogicalName: Record<string, string>
  isCustomByLogicalName: Record<string, boolean>
  openTableByLogicalName: (logicalName: string) => void
  copyToClipboard: (text: string, field: string) => void
  copiedField: string | null
  theme: Theme
  isLoading: boolean
  error: string | null | undefined
  onRetry: () => void
}) {
  const resolveDisplayName = (logicalName: string) =>
    displayNameByLogicalName[logicalName.toLowerCase()] ?? logicalName

  const [isErDiagramOpen, setIsErDiagramOpen] = useState(false)

  const erDiagram = useMemo(
    () =>
      buildMermaidErDiagram({
        tableLogicalName,
        columns: tableColumns,
        relationships: allRelationships,
        isCustomByLogicalName,
      }),
    [allRelationships, isCustomByLogicalName, tableColumns, tableLogicalName]
  )

  const diagramCopyKey = `relationship:er:${tableLogicalName}`

  const oneToMany = relationships.filter((r) => r.kind === "OneToMany")
  const manyToOne = relationships.filter((r) => r.kind === "ManyToOne")
  const manyToMany = relationships.filter((r) => r.kind === "ManyToMany")

  return (
    <div className="mt-4">
      {!isLoading && !error && (
        <div className="mb-6 rounded-xl border border-border bg-card/30 p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">ER diagram</div>
              <div className="text-xs text-muted-foreground">
                Omits {erDiagram.omittedRelationshipCount} system relationships and {erDiagram.omittedColumnCount} system columns.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void copyToClipboard(erDiagram.code, diagramCopyKey)}
              >
                Copy Mermaid
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsErDiagramOpen(true)}
                title="Expand ER diagram"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {copiedField === diagramCopyKey && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Copied
                </span>
              )}
            </div>
          </div>
          <MermaidDiagram code={erDiagram.code} theme={theme} />
        </div>
      )}

      <ErDiagramModal
        open={isErDiagramOpen}
        onClose={() => setIsErDiagramOpen(false)}
        title={`${resolveDisplayName(tableLogicalName)} (${tableLogicalName})`}
        code={erDiagram.code}
        theme={theme}
        onCopy={() => void copyToClipboard(erDiagram.code, diagramCopyKey)}
      />

      <div className="flex flex-wrap gap-3">
        <Badge variant="success" className="h-7 rounded-lg px-3">
          1:N {relationshipCounts.OneToMany}
        </Badge>
        <Badge variant="warning" className="h-7 rounded-lg px-3">
          N:1 {relationshipCounts.ManyToOne}
        </Badge>
        <Badge variant="secondary" className="h-7 rounded-lg px-3">
          N:N {relationshipCounts.ManyToMany}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Showing relationships connected to <span className="font-mono">{tableLogicalName}</span>
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading relationships...
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="my-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !error && relationships.length === 0 && (
        <div className="mt-6 rounded-xl border border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
          No relationships found for this table.
        </div>
      )}

      {!isLoading && !error && relationships.length > 0 && (
        <>
          <RelationshipSection
            title="Has many"
            subtitle="relationships"
            items={oneToMany}
            resolveDisplayName={resolveDisplayName}
            openTableByLogicalName={openTableByLogicalName}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
          />
          <RelationshipSection
            title="Belongs to"
            subtitle="relationships"
            items={manyToOne}
            resolveDisplayName={resolveDisplayName}
            openTableByLogicalName={openTableByLogicalName}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
          />
          <RelationshipSection
            title="Many-to-many"
            subtitle="relationships"
            items={manyToMany}
            resolveDisplayName={resolveDisplayName}
            openTableByLogicalName={openTableByLogicalName}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
          />
        </>
      )}
    </div>
  )
}

export default App
