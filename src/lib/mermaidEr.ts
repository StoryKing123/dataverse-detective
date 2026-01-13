import type { TableColumn, TableRelationship } from '@/types'

const SYSTEM_COLUMN_LOGICAL_NAMES = new Set([
  'createdby',
  'createdbyname',
  'createdon',
  'createdonbehalfby',
  'createdonbehalfbyname',
  'modifiedby',
  'modifiedbyname',
  'modifiedon',
  'modifiedonbehalfby',
  'modifiedonbehalfbyname',
  'ownerid',
  'owneridname',
  'owningbusinessunit',
  'owningteam',
  'owninguser',
  'statecode',
  'statuscode',
  'versionnumber',
  'importsequencenumber',
  'overriddencreatedon',
  'timezoneruleversionnumber',
  'utcconversiontimezonecode',
  'transactioncurrencyid',
  'transactioncurrencyidname',
])

function sanitizeEntityName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_')
}

function isSystemColumn(column: TableColumn): boolean {
  if (column.isPrimaryKey) return false
  if (column.requirement === 'System') return true
  return SYSTEM_COLUMN_LOGICAL_NAMES.has(column.logicalName.toLowerCase())
}

function filterRelationshipsForErDiagram(
  relationships: TableRelationship[],
  systemColumns: Set<string>
): { visible: TableRelationship[]; omitted: number } {
  let omitted = 0
  const visible: TableRelationship[] = []

  for (const rel of relationships) {
    const referencingAttribute = rel.referencingAttribute?.toLowerCase()
    if (referencingAttribute && systemColumns.has(referencingAttribute)) {
      omitted += 1
      continue
    }
    visible.push(rel)
  }

  return { visible, omitted }
}

function getRelationshipSyntax(
  current: string,
  related: string,
  relationship: TableRelationship
): string {
  const label = relationship.schemaName.replaceAll('"', "'")

  if (relationship.kind === 'OneToMany') {
    return `${current} ||--o{ ${related} : "${label}"`
  }
  if (relationship.kind === 'ManyToOne') {
    return `${current} }o--|| ${related} : "${label}"`
  }
  return `${current} }o--o{ ${related} : "${label}"`
}

function mapToMermaidType(type: string): string {
  const normalized = type.toLowerCase()
  if (normalized.includes('int') || normalized === 'integer') return 'int'
  if (normalized.includes('decimal') || normalized.includes('money') || normalized.includes('float') || normalized.includes('double')) {
    return 'float'
  }
  if (normalized.includes('bool')) return 'boolean'
  if (normalized.includes('date') || normalized.includes('time')) return 'datetime'
  return 'string'
}

export function buildMermaidErDiagram(args: {
  tableLogicalName: string
  columns: TableColumn[]
  relationships: TableRelationship[]
}): {
  code: string
  omittedRelationshipCount: number
  omittedColumnCount: number
  relationshipCount: number
} {
  const current = sanitizeEntityName(args.tableLogicalName)
  const systemColumns = new Set<string>()

  let omittedColumnCount = 0
  const attributeLines: string[] = []
  for (const column of args.columns) {
    const system = isSystemColumn(column)
    if (system) {
      systemColumns.add(column.logicalName.toLowerCase())
      omittedColumnCount += 1
      continue
    }

    const columnType = mapToMermaidType(column.type)
    const pkMarker = column.isPrimaryKey ? ' PK' : ''
    attributeLines.push(`    ${columnType} ${column.logicalName}${pkMarker}`)
  }

  const { visible: visibleRelationships, omitted: omittedRelationshipCount } =
    filterRelationshipsForErDiagram(args.relationships, systemColumns)

  const relationshipLines: string[] = visibleRelationships.map((relationship) => {
    const related = sanitizeEntityName(relationship.relatedTableLogicalName)
    return `  ${getRelationshipSyntax(current, related, relationship)}`
  })

  const entityLines: string[] = []
  if (attributeLines.length > 0) {
    entityLines.push(`  ${current} {`)
    entityLines.push(...attributeLines)
    entityLines.push('  }')
  } else {
    entityLines.push(`  ${current}`)
  }

  const code = ['erDiagram', ...entityLines, ...relationshipLines].join('\n')

  return {
    code,
    omittedRelationshipCount,
    omittedColumnCount,
    relationshipCount: visibleRelationships.length,
  }
}
