import { useState, useMemo } from "react"
import { Search, ChevronDown, ChevronRight, Copy, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ColumnMetadata, AttributeType } from "@/types/entity"

interface ColumnTableProps {
  columns: ColumnMetadata[]
}

const typeVariantMap: Record<string, "string" | "picklist" | "lookup" | "datetime" | "boolean" | "number" | "memo"> = {
  String: "string",
  Memo: "memo",
  Integer: "number",
  BigInt: "number",
  Decimal: "number",
  Double: "number",
  Money: "number",
  Boolean: "boolean",
  DateTime: "datetime",
  Lookup: "lookup",
  Picklist: "picklist",
  State: "picklist",
  Status: "picklist",
  MultiSelectPicklist: "picklist",
  Owner: "lookup",
  Customer: "lookup",
}

export function ColumnTable({ columns }: ColumnTableProps) {
  const [search, setSearch] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const filteredColumns = useMemo(() => {
    if (!search) return columns
    const term = search.toLowerCase()
    return columns.filter(
      (col) =>
        col.displayName?.toLowerCase().includes(term) ||
        col.logicalName.toLowerCase().includes(term)
    )
  }, [columns, search])

  const toggleRow = (logicalName: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(logicalName)) {
        next.delete(logicalName)
      } else {
        next.add(logicalName)
      }
      return next
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h3 className="font-semibold">
          Columns{" "}
          <span className="font-normal text-muted-foreground">
            ({filteredColumns.length})
          </span>
        </h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-9 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted/50 backdrop-blur">
            <tr className="border-b text-left text-xs font-medium text-muted-foreground">
              <th className="w-8 px-6 py-2"></th>
              <th className="px-4 py-2">Display Name</th>
              <th className="px-4 py-2">Logical Name</th>
              <th className="px-4 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredColumns.map((column) => (
              <ColumnRow
                key={column.logicalName}
                column={column}
                isExpanded={expandedRows.has(column.logicalName)}
                onToggle={() => toggleRow(column.logicalName)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ColumnRowProps {
  column: ColumnMetadata
  isExpanded: boolean
  onToggle: () => void
}

function ColumnRow({ column, isExpanded, onToggle }: ColumnRowProps) {
  const [copied, setCopied] = useState(false)
  const hasOptions = column.options && column.options.length > 0
  const variant = typeVariantMap[column.attributeType] || "secondary"

  const copyLogicalName = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(column.logicalName)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <tr
        className={cn(
          "group border-b transition-colors",
          hasOptions && "cursor-pointer hover:bg-accent/50"
        )}
        onClick={hasOptions ? onToggle : undefined}
      >
        <td className="px-6 py-2.5">
          {hasOptions && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </td>
        <td className="px-4 py-2.5">
          <span className={cn(!column.displayName && "text-muted-foreground italic")}>
            {column.displayName || "(No display name)"}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <code className="text-sm">{column.logicalName}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={copyLogicalName}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <Badge variant={variant}>{column.attributeType}</Badge>
        </td>
      </tr>
      <AnimatePresence>
        {isExpanded && hasOptions && (
          <tr>
            <td colSpan={4} className="bg-muted/30 px-6 py-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 py-3 pl-8">
                  {column.options?.map((option) => (
                    <div
                      key={option.value}
                      className="flex flex-col rounded-md border bg-background px-3 py-2"
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}
