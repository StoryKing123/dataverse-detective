import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { EntityMetadata } from "@/types/entity"

interface TableListProps {
  tables: EntityMetadata[]
  selectedTable: EntityMetadata | null
  onSelectTable: (table: EntityMetadata) => void
}

export function TableList({
  tables,
  selectedTable,
  onSelectTable,
}: TableListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tables.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  })

  if (tables.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
        <p>No tables found</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const table = tables[virtualItem.index]
          const isSelected = selectedTable?.logicalName === table.logicalName

          return (
            <motion.div
              key={table.logicalName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(virtualItem.index * 0.02, 0.3) }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <button
                onClick={() => onSelectTable(table)}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-l-2 px-4 py-2.5 text-left transition-colors",
                  isSelected
                    ? "border-l-primary bg-accent"
                    : "border-l-transparent hover:bg-accent/50"
                )}
              >
                <span className="truncate font-medium text-foreground">
                  {table.displayName || table.logicalName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {table.logicalName}
                </span>
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
