import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TableFilter } from "@/types/entity"

interface TableSearchProps {
  filter: TableFilter
  onFilterChange: (filter: TableFilter) => void
  resultCount: number
  totalCount: number
}

const filterOptions: { label: string; value: TableFilter["tableType"] }[] = [
  { label: "All", value: "all" },
  { label: "Custom", value: "custom" },
  { label: "System", value: "system" },
]

export function TableSearch({
  filter,
  onFilterChange,
  resultCount,
  totalCount,
}: TableSearchProps) {
  return (
    <div className="flex flex-col gap-3 border-b p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tables..."
          value={filter.searchTerm}
          onChange={(e) =>
            onFilterChange({ ...filter, searchTerm: e.target.value })
          }
          className="pl-9 pr-9"
        />
        {filter.searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => onFilterChange({ ...filter, searchTerm: "" })}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter.tableType === option.value ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() =>
                onFilterChange({ ...filter, tableType: option.value })
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Badge variant="secondary" className="text-xs">
          {resultCount.toLocaleString()}
          {resultCount !== totalCount && ` / ${totalCount.toLocaleString()}`}
        </Badge>
      </div>
    </div>
  )
}
