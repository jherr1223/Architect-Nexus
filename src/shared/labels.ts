import type { DocumentStatus } from '@shared/schemas/document'

export function statusLabel(status: DocumentStatus): string {
  switch (status) {
    case 'in-review':
      return 'In review'
    case 'draft':
      return 'Draft'
    case 'approved':
      return 'Approved'
    case 'deprecated':
      return 'Deprecated'
  }
}
