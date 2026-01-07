import { useState, useMemo } from "react"
import { ThemeProvider } from "@/hooks/useTheme"
import { Layout } from "@/components/layout/Layout"
import { TableSearch } from "@/components/search/TableSearch"
import { TableList } from "@/components/search/TableList"
import { TableDetails } from "@/components/details/TableDetails"
import { mockTables } from "@/data/mockData"
import type { EntityMetadata, TableFilter } from "@/types/entity"

function App() {
  const [selectedTable, setSelectedTable] = useState<EntityMetadata | null>(null)
  const [filter, setFilter] = useState<TableFilter>({
    searchTerm: "",
    tableType: "all",
  })

  const filteredTables = useMemo(() => {
    return mockTables.filter((table) => {
      // 按类型过滤
      if (filter.tableType === "custom" && !table.isCustomEntity) return false
      if (filter.tableType === "system" && table.isCustomEntity) return false

      // 按搜索词过滤
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase()
        return (
          table.displayName?.toLowerCase().includes(term) ||
          table.logicalName.toLowerCase().includes(term)
        )
      }

      return true
    })
  }, [filter])

  const sidebar = (
    <>
      <TableSearch
        filter={filter}
        onFilterChange={setFilter}
        resultCount={filteredTables.length}
        totalCount={mockTables.length}
      />
      <TableList
        tables={filteredTables}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
      />
    </>
  )

  return (
    <ThemeProvider>
      <Layout sidebar={sidebar}>
        <TableDetails table={selectedTable} />
      </Layout>
    </ThemeProvider>
  )
}

export default App
