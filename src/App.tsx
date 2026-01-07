import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
	  Search,
	  Moon,
	  Sun,
	  LayoutGrid,
	} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { TableEntity, TableColumn, Theme } from "./types"
import { useDataverse } from "@/hooks/useDataverse"
import { useUrlParams } from "@/hooks/useUrlParams"
import { buildViewUrl, buildDataverseEditUrl } from "@/services/url.utils"
import { getEnvironmentId } from "@/services/dataverse.service"

function App() {
  // 主题状态
  const [theme, setTheme] = useState<Theme>("light")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null)
  const [columnSearch, setColumnSearch] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // 使用 Dataverse Hook 获取数据
  const { tables, loadingState, errors, loadColumns, retryLoadTables } = useDataverse()

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
	        queueMicrotask(() => setSelectedTable(targetTable))
	        // 如果 columns 为空，触发懒加载
	        if (targetTable.columns.length === 0) {
	          loadColumns(targetTable.logicalName)
	        }
	      }
	    }
	  }, [logicname, tables, loadColumns])

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

  // 获取当前选中的 table 的最新数据（包含已加载的 columns）
  const currentTable = useMemo(() => {
    if (!selectedTable) return null
    return tables.find(t => t.logicalName === selectedTable.logicalName) || selectedTable
  }, [selectedTable, tables])

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
            <span className="text-foreground">X-Ray</span>
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
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, opacity: 0 }}
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-[400px] shrink-0 flex-col border-r border-border bg-background">
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
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
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
                {filteredTables.map((table, index) => {
                const isSelected = selectedTable?.logicalName === table.logicalName
                return (
                  <motion.button
                    key={table.logicalName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => {
                      setSelectedTable(table)
                      setColumnSearch("")
                      // 懒加载 columns：如果 columns 为空，触发加载
                      if (table.columns.length === 0) {
                        loadColumns(table.logicalName)
                      }
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
        <main className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {!currentTable ? (
              <EmptyState key="empty" tableCount={tables.length} />
            ) : (
              <TableDetail
                key={currentTable.logicalName}
                table={currentTable}
                columnSearch={columnSearch}
                setColumnSearch={setColumnSearch}
                filteredColumns={filteredColumns}
                copyToClipboard={copyToClipboard}
                copiedField={copiedField}
                isLoadingColumns={loadingState.columns[currentTable.logicalName] === 'loading'}
                columnError={errors.columns[currentTable.logicalName]}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col items-center justify-center bg-background"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
      >
        <LayoutGrid className="h-10 w-10 text-violet-500" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-3 text-3xl font-bold text-foreground"
      >
        Entity Metadata Explorer
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mb-10 max-w-md text-center text-muted-foreground"
      >
        Select a table from the sidebar to inspect its schema, verify data types, and access deep links to Dynamics 365 views.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
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
    </motion.div>
  )
}

// 表详情组件
interface TableDetailProps {
  table: TableEntity
  columnSearch: string
  setColumnSearch: (value: string) => void
  filteredColumns: TableColumn[]
  copyToClipboard: (text: string, field: string) => void
  copiedField: string | null
  isLoadingColumns: boolean
  columnError: string | null | undefined
}

function TableDetail({
  table,
  columnSearch,
  setColumnSearch,
  filteredColumns,
  copyToClipboard,
  copiedField,
  isLoadingColumns,
  columnError,
	}: TableDetailProps) {
    const [dataverseEditError, setDataverseEditError] = useState<string | null>(null)

	  const primaryKey = useMemo(() => {
	    const pk = table.columns.find((c) => c.isPrimaryKey)?.logicalName
	    return pk ?? "—"
	  }, [table.columns])

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
	      initial={{ opacity: 0, x: 20 }}
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

	      {/* Columns */}
	      <div className="mt-6 flex items-center justify-between gap-4">
	        <div className="flex items-baseline gap-3">
	          <h3 className="text-base font-semibold text-foreground">Columns</h3>
	          <span className="text-sm text-muted-foreground">
	            {filteredColumns.length} visible
	          </span>
	        </div>
	        <div className="w-72">
	          <Input
	            placeholder="Search columns..."
	            value={columnSearch}
	            onChange={(e) => setColumnSearch(e.target.value)}
	          />
	        </div>
	      </div>

	      {/* Table */}
	      <div className="mt-3 border-t border-border">
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
	                      Display Name
	                    </th>
	                    <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
	                      Logical Name
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
	                    {filteredColumns.map((column) => (
	                      <motion.tr
	                        key={column.logicalName}
	                        initial={{ opacity: 0 }}
	                        animate={{ opacity: 1 }}
	                        exit={{ opacity: 0 }}
	                        transition={{ duration: 0.15 }}
	                        className="group transition-colors hover:bg-muted/30"
	                      >
	                        <td className="px-3 py-2">
	                          <div className="flex flex-wrap items-center gap-2">
	                            <span className="font-medium text-foreground">
	                              {column.displayName}
	                            </span>
	                            {column.isPrimaryKey && (
	                              <Badge
	                                variant="secondary"
	                                className="h-5 px-2 py-0 text-[10px]"
	                              >
	                                Primary Key
	                              </Badge>
	                            )}
	                          </div>
	                        </td>
	                        <td className="px-3 py-2">
	                          <span className="font-mono text-xs text-muted-foreground">
	                            {column.logicalName}
	                          </span>
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
	                            {column.optionCount && (
	                              <Badge
	                                variant="outline"
	                                className="h-5 px-2 py-0 text-[10px]"
	                              >
	                                {column.optionCount} Options
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
	                    ))}
	                  </AnimatePresence>
	                </tbody>
	              </table>
	            </div>
	          )}
	        </div>
	    </motion.div>
	  )
	}

export default App
