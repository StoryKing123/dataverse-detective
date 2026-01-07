import { motion } from "framer-motion"
import { Database } from "lucide-react"
import type { EntityMetadata } from "@/types/entity"
import { TableHeader } from "./TableHeader"
import { ColumnTable } from "./ColumnTable"

interface TableDetailsProps {
  table: EntityMetadata | null
}

export function TableDetails({ table }: TableDetailsProps) {
  if (!table) {
    return <EmptyState />
  }

  return (
    <motion.div
      key={table.logicalName}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col"
    >
      <TableHeader table={table} />
      <ColumnTable columns={table.columns} />
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Database className="h-16 w-16 stroke-[1.5]" />
      </motion.div>
      <div className="text-center">
        <p className="text-lg font-medium">No table selected</p>
        <p className="text-sm">Select a table from the sidebar to view its structure</p>
      </div>
    </div>
  )
}
