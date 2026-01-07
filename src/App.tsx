import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Moon,
  Sun,
  ExternalLink,
  Copy,
  Check,
  LayoutGrid,
  Link2,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TableEntity, TableColumn, Theme } from "./types"

// 模拟数据
const mockTables: TableEntity[] = [
  {
    displayName: "Account",
    logicalName: "account",
    objectTypeCode: 1,
    isCustomEntity: false,
    columns: [
      { displayName: "Account", logicalName: "accountid", type: "Uniqueidentifier", requirement: "System", isPrimaryKey: true },
      { displayName: "Account Name", logicalName: "name", type: "String", maxLength: 160, requirement: "Required" },
      { displayName: "Primary Contact", logicalName: "primarycontactid", type: "Lookup", requirement: "Optional" },
      { displayName: "Revenue", logicalName: "revenue", type: "Money", requirement: "Optional" },
      { displayName: "Industry", logicalName: "industrycode", type: "Picklist", optionCount: 33, requirement: "Optional" },
    ],
  },
  {
    displayName: "Contact",
    logicalName: "contact",
    objectTypeCode: 2,
    isCustomEntity: false,
    columns: [
      { displayName: "Contact", logicalName: "contactid", type: "Uniqueidentifier", requirement: "System", isPrimaryKey: true },
      { displayName: "Full Name", logicalName: "fullname", type: "String", maxLength: 160, requirement: "Required" },
      { displayName: "Email", logicalName: "emailaddress1", type: "String", maxLength: 100, requirement: "Optional" },
      { displayName: "Phone", logicalName: "telephone1", type: "String", maxLength: 50, requirement: "Optional" },
    ],
  },
  {
    displayName: "Opportunity",
    logicalName: "opportunity",
    objectTypeCode: 3,
    isCustomEntity: false,
    columns: [
      { displayName: "Opportunity", logicalName: "opportunityid", type: "Uniqueidentifier", requirement: "System", isPrimaryKey: true },
      { displayName: "Topic", logicalName: "name", type: "String", maxLength: 300, requirement: "Required" },
      { displayName: "Est. Revenue", logicalName: "estimatedvalue", type: "Money", requirement: "Optional" },
      { displayName: "Probability", logicalName: "closeprobability", type: "Integer", requirement: "Optional" },
    ],
  },
  {
    displayName: "Project Request",
    logicalName: "new_custom_project",
    objectTypeCode: 11765,
    isCustomEntity: true,
    columns: [
      { displayName: "Project Request", logicalName: "new_custom_projectid", type: "Uniqueidentifier", requirement: "System", isPrimaryKey: true },
      { displayName: "Project Name", logicalName: "new_name", type: "String", maxLength: 100, requirement: "Required" },
      { displayName: "Approved Budget", logicalName: "new_budget", type: "Money", requirement: "Optional" },
      { displayName: "Urgent?", logicalName: "new_is_urgent", type: "Boolean", requirement: "Optional" },
      { displayName: "Priority", logicalName: "new_priority", type: "Picklist", optionCount: 4, requirement: "Required" },
    ],
  },
]

function App() {
  const [theme, setTheme] = useState<Theme>("light")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null)
  const [columnSearch, setColumnSearch] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // 主题切换
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  // 过滤表列表
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return mockTables
    const query = searchQuery.toLowerCase()
    return mockTables.filter(
      (t) =>
        t.displayName.toLowerCase().includes(query) ||
        t.logicalName.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // 过滤列
  const filteredColumns = useMemo(() => {
    if (!selectedTable) return []
    if (!columnSearch.trim()) return selectedTable.columns
    const query = columnSearch.toLowerCase()
    return selectedTable.columns.filter(
      (c) =>
        c.displayName.toLowerCase().includes(query) ||
        c.logicalName.toLowerCase().includes(query)
    )
  }, [selectedTable, columnSearch])

  // 复制到剪贴板
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <LayoutGrid className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-lg font-semibold">
            <span className="text-violet-600 dark:text-violet-400">Dataverse</span>{" "}
            <span className="text-gray-900 dark:text-white">X-Ray</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
        <aside className="flex w-[400px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Table Search
              </span>
              <Badge variant="secondary" className="h-5 min-w-[20px] justify-center px-1.5 text-[10px]">
                {filteredTables.length}
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Filter by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
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
                    }}
                    className={cn(
                      "group relative flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                      isSelected
                        ? "bg-violet-50 dark:bg-violet-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isSelected
                          ? "text-violet-700 dark:text-violet-300"
                          : "text-gray-900 dark:text-gray-100"
                      )}
                    >
                      {table.displayName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {table.logicalName}
                    </span>
                    {table.isCustomEntity && (
                      <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500" />
                    )}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedTable ? (
              <EmptyState key="empty" tableCount={mockTables.length} />
            ) : (
              <TableDetail
                key={selectedTable.logicalName}
                table={selectedTable}
                columnSearch={columnSearch}
                setColumnSearch={setColumnSearch}
                filteredColumns={filteredColumns}
                copyToClipboard={copyToClipboard}
                copiedField={copiedField}
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
      className="glass-effect flex h-full flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg dark:bg-gray-800"
      >
        <LayoutGrid className="h-10 w-10 text-violet-500" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-3 text-3xl font-bold text-gray-900 dark:text-white"
      >
        Entity Metadata Explorer
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mb-10 max-w-md text-center text-gray-500 dark:text-gray-400"
      >
        Select a table from the sidebar to inspect its schema, verify data types, and access deep links to Dynamics 365 views.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex gap-4"
      >
        <div className="flex flex-col items-center rounded-xl bg-white px-10 py-5 shadow-md dark:bg-gray-800">
          <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {tableCount}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Tables Indexed
          </span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-white px-10 py-5 shadow-md dark:bg-gray-800">
          <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            Instant
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
}

function TableDetail({
  table,
  columnSearch,
  setColumnSearch,
  filteredColumns,
  copyToClipboard,
  copiedField,
}: TableDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="glass-effect h-full overflow-y-auto p-6"
    >
      {/* 表头信息卡片 */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
              {table.displayName}
            </h2>
            <button
              onClick={() => copyToClipboard(table.logicalName, "logicalName")}
              className="group flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span className="font-mono">{table.logicalName}</span>
              {copiedField === "logicalName" ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                OTC: {table.objectTypeCode}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Cols: {table.columns.length}
              </Badge>
              {table.isCustomEntity && (
                <Badge variant="default">Custom Entity</Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5">
              <ExternalLink className="h-4 w-4" />
              Open View
            </Button>
            <Button className="gap-1.5">
              <ExternalLink className="h-4 w-4" />
              Edit Dataverse
            </Button>
          </div>
        </div>
      </div>

      {/* 列信息 */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Columns
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredColumns.length} visible
            </span>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search columns..."
              value={columnSearch}
              onChange={(e) => setColumnSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* 列表格 */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Display Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Logical Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Requirement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence mode="popLayout">
                {filteredColumns.map((column, index) => (
                  <motion.tr
                    key={column.logicalName}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {column.displayName}
                        </span>
                        {column.isPrimaryKey && (
                          <Link2 className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                        {column.logicalName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-violet-600 dark:text-violet-400">
                          {column.type}
                        </span>
                        {column.maxLength && (
                          <Badge variant="secondary" className="text-[10px]">
                            {column.maxLength}
                          </Badge>
                        )}
                        {column.optionCount && (
                          <button className="flex items-center gap-0.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                            {column.optionCount} Options
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant={
                          column.requirement === "System"
                            ? "system"
                            : column.requirement === "Required"
                            ? "required"
                            : "optional"
                        }
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
      </div>
    </motion.div>
  )
}

export default App
