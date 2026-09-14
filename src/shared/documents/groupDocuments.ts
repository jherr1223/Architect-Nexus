import type { DocumentMeta, DocumentStatus, DocumentType } from '@shared/schemas/document'
import { statusLabel } from '@shared/labels'
import { documentTypeLabel } from '@shared/templates/createDocument'

export const GROUP_BY_OPTIONS = ['type', 'status', 'business', 'system'] as const
export type GroupBy = (typeof GROUP_BY_OPTIONS)[number]

export function isGroupBy(value: string): value is GroupBy {
  return (GROUP_BY_OPTIONS as readonly string[]).includes(value)
}

export interface DocumentGroup {
  key: string
  title: string
  documents: DocumentMeta[]
}

const STATUS_ORDER: DocumentStatus[] = ['draft', 'in-review', 'approved', 'deprecated']
const TYPE_ORDER: DocumentType[] = ['solution-architecture', 'adr', 'visio']

function groupIdentity(document: DocumentMeta, groupBy: GroupBy): { key: string; title: string } {
  if (groupBy === 'type') {
    return { key: document.type, title: documentTypeLabel(document.type) }
  }
  if (groupBy === 'status') {
    return { key: document.status, title: statusLabel(document.status) }
  }

  const value = groupBy === 'business' ? document.business.trim() : document.system.trim()
  if (value.length === 0) {
    return {
      key: `${groupBy}:`,
      title: groupBy === 'business' ? 'Unassigned business' : 'Unassigned system'
    }
  }

  return { key: `${groupBy}:${value.toLowerCase()}`, title: value }
}

export function groupDocuments(documents: DocumentMeta[], groupBy: GroupBy): DocumentGroup[] {
  const groups = new Map<string, DocumentGroup>()

  for (const document of documents) {
    const identity = groupIdentity(document, groupBy)
    const existing = groups.get(identity.key)
    if (existing) {
      existing.documents.push(document)
    } else {
      groups.set(identity.key, { ...identity, documents: [document] })
    }
  }

  const result = [...groups.values()]
  if (groupBy === 'status') {
    return result.sort(
      (left, right) =>
        STATUS_ORDER.indexOf(left.key as DocumentStatus) - STATUS_ORDER.indexOf(right.key as DocumentStatus)
    )
  }
  if (groupBy === 'type') {
    return result.sort(
      (left, right) => TYPE_ORDER.indexOf(left.key as DocumentType) - TYPE_ORDER.indexOf(right.key as DocumentType)
    )
  }

  return result.sort((left, right) => {
    const leftUnassigned = left.key.endsWith(':')
    const rightUnassigned = right.key.endsWith(':')
    if (leftUnassigned !== rightUnassigned) {
      return leftUnassigned ? 1 : -1
    }
    return left.title.localeCompare(right.title)
  })
}
