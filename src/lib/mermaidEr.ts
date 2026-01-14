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
  args: {
    systemColumns: Set<string>
    currentColumnsByLogicalName: Map<string, TableColumn>
    isCustomByLogicalName?: Record<string, boolean>
  }
): { visible: TableRelationship[]; omitted: number } {
  let omitted = 0
  const visible: TableRelationship[] = []

  const isCustomTable = (logicalName: string | undefined) => {
    if (!logicalName) return undefined
    return args.isCustomByLogicalName?.[logicalName.toLowerCase()]
  }

  for (const rel of relationships) {
    const referencingAttribute = rel.referencingAttribute?.toLowerCase()
    if (
      referencingAttribute &&
      (args.systemColumns.has(referencingAttribute) || SYSTEM_COLUMN_LOGICAL_NAMES.has(referencingAttribute))
    ) {
      omitted += 1
      continue
    }

    if (rel.kind === 'ManyToOne') {
      if (!referencingAttribute) {
        omitted += 1
        continue
      }
      const column = args.currentColumnsByLogicalName.get(referencingAttribute)
      if (!column) {
        omitted += 1
        continue
      }
      if (isSystemColumn(column)) {
        omitted += 1
        continue
      }
      if (column.type !== 'Lookup') {
        omitted += 1
        continue
      }
      visible.push(rel)
      continue
    }

    if (rel.kind === 'OneToMany') {
      const relatedIsCustom = isCustomTable(rel.relatedTableLogicalName)
      if (relatedIsCustom !== true) {
        omitted += 1
        continue
      }
      visible.push(rel)
      continue
    }

    if (rel.kind === 'ManyToMany') {
      const relatedIsCustom = isCustomTable(rel.relatedTableLogicalName)
      const intersectIsCustom = isCustomTable(rel.intersectEntityName)
      if (relatedIsCustom !== true && intersectIsCustom !== true) {
        omitted += 1
        continue
      }
      visible.push(rel)
      continue
    }

    visible.push(rel)
  }

  return { visible, omitted }
}

function formatRelationshipLabel(args: {
  relationship: TableRelationship
  currentPrimaryKey: string | null
}): string {
  const schema = args.relationship.schemaName.replaceAll('"', "'")
  const lookup = args.relationship.referencingAttribute
  const referenced = args.relationship.referencedAttribute

  if (args.relationship.kind === 'ManyToMany') {
    const via = args.relationship.intersectEntityName
    return via ? `${schema} (via ${via})` : schema
  }

  if (!lookup && !referenced) return schema

  if (args.relationship.kind === 'OneToMany') {
    const target = referenced ?? args.currentPrimaryKey ?? 'id'
    return lookup ? `${schema} (${lookup} -> ${target})` : schema
  }

  const target = referenced ?? 'id'
  return lookup ? `${schema} (${lookup} -> ${target})` : schema
}

function getRelationshipSyntax(args: {
  current: string
  related: string
  relationship: TableRelationship
  currentPrimaryKey: string | null
}): string {
  const label = formatRelationshipLabel({
    relationship: args.relationship,
    currentPrimaryKey: args.currentPrimaryKey,
  })

  if (args.relationship.kind === 'OneToMany') {
    return `${args.current} ||--o{ ${args.related} : "${label}"`
  }
  if (args.relationship.kind === 'ManyToOne') {
    return `${args.current} }o--|| ${args.related} : "${label}"`
  }
  return `${args.current} }o--o{ ${args.related} : "${label}"`
}

function mapToMermaidType(type: string): string {
  const normalized = type.toLowerCase()
  if (normalized === 'uniqueidentifier' || normalized === 'guid' || normalized === 'uuid') return 'guid'
  if (normalized === 'lookup' || normalized === 'customer' || normalized === 'owner') return 'lookup'
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
  isCustomByLogicalName?: Record<string, boolean>
}): {
  code: string
  omittedRelationshipCount: number
  omittedColumnCount: number
  relationshipCount: number
} {
  const current = sanitizeEntityName(args.tableLogicalName)
  const systemColumns = new Set<string>()
  const currentColumnsByLogicalName = new Map<string, TableColumn>()

  const currentPrimaryKey = args.columns.find((column) => column.isPrimaryKey)?.logicalName ?? null

  let omittedColumnCount = 0
  const attributeLines: string[] = []
  for (const column of args.columns) {
    currentColumnsByLogicalName.set(column.logicalName.toLowerCase(), column)
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
    filterRelationshipsForErDiagram(args.relationships, {
      systemColumns,
      currentColumnsByLogicalName,
      isCustomByLogicalName: args.isCustomByLogicalName,
    })

  const relatedEntityAttributes = new Map<string, { lookups: Set<string>; primaryKeys: Set<string> }>()
  const ensureRelated = (logicalName: string) => {
    const key = logicalName.toLowerCase()
    const existing = relatedEntityAttributes.get(key)
    if (existing) return existing
    const created = { lookups: new Set<string>(), primaryKeys: new Set<string>() }
    relatedEntityAttributes.set(key, created)
    return created
  }

  for (const relationship of visibleRelationships) {
    const relatedKey = relationship.relatedTableLogicalName
    if (!relatedKey) continue
    const info = ensureRelated(relatedKey)

    if (relationship.kind === 'OneToMany') {
      if (relationship.referencingAttribute) {
        info.lookups.add(relationship.referencingAttribute)
      }
      continue
    }

    if (relationship.kind === 'ManyToOne') {
      if (relationship.referencedAttribute) {
        info.primaryKeys.add(relationship.referencedAttribute)
      }
      continue
    }
  }

  const relationshipLines: string[] = visibleRelationships.map((relationship) => {
    const related = sanitizeEntityName(relationship.relatedTableLogicalName)
    return `  ${getRelationshipSyntax({
      current,
      related,
      relationship,
      currentPrimaryKey,
    })}`
  })

  const entityLines: string[] = []
  if (attributeLines.length > 0) {
    entityLines.push(`  ${current} {`)
    entityLines.push(...attributeLines)
    entityLines.push('  }')
  } else {
    entityLines.push(`  ${current}`)
  }

  for (const [logicalName, info] of [...relatedEntityAttributes.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const entityName = sanitizeEntityName(logicalName)
    const lines: string[] = []
    for (const pk of [...info.primaryKeys].sort()) {
      lines.push(`    guid ${pk} PK`)
    }
    for (const lookup of [...info.lookups].sort()) {
      lines.push(`    lookup ${lookup}`)
    }
    if (lines.length === 0) {
      entityLines.push(`  ${entityName}`)
      continue
    }
    entityLines.push(`  ${entityName} {`)
    entityLines.push(...lines)
    entityLines.push('  }')
  }

  const code = ['erDiagram', ...entityLines, ...relationshipLines].join('\n')

  return {
    code,
    omittedRelationshipCount,
    omittedColumnCount,
    relationshipCount: visibleRelationships.length,
  }
}
