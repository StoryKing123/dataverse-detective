import { ExternalLink, Pencil, Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { EntityMetadata } from "@/types/entity"

interface TableHeaderProps {
  table: EntityMetadata
}

export function TableHeader({ table }: TableHeaderProps) {
  const [copied, setCopied] = useState(false)

  const copyLogicalName = async () => {
    await navigator.clipboard.writeText(table.logicalName)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-b p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">
            {table.displayName || table.logicalName}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <code className="text-sm text-muted-foreground">
              {table.logicalName}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={copyLogicalName}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
            Open View
          </Button>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Edit Data
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <InfoCard label="OTC" value={table.objectTypeCode.toString()} />
        <InfoCard label="Columns" value={table.columns.length.toString()} />
        <InfoCard
          label="Type"
          value={table.isCustomEntity ? "Custom" : "System"}
        />
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-w-[100px]">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
