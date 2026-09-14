import type {
  AdrBody,
  CreateDocumentInput,
  DocumentType,
  SadBody,
  StoredDocument,
  VisioDocument
} from '@shared/schemas/document'
import type { VisioExtension } from '@shared/visio/files'

export function emptySadBody(): SadBody {
  return {
    context: '',
    goals: '',
    nonGoals: '',
    stakeholders: [],
    functionalRequirements: [],
    nonFunctionalRequirements: [],
    currentArchitecture: '',
    targetArchitecture: '',
    integrations: [],
    risks: [],
    openQuestions: []
  }
}

export function emptyAdrBody(): AdrBody {
  return {
    context: '',
    decision: '',
    consequences: '',
    alternatives: []
  }
}

export function createStoredDocument(
  input: CreateDocumentInput,
  now = new Date()
): StoredDocument {
  const timestamp = now.toISOString()
  const id = crypto.randomUUID()
  const metaBase = {
    id,
    title: input.title.trim(),
    status: 'draft' as const,
    version: '0.1.0',
    business: '',
    system: '',
    author: '',
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp
  }

  if (input.type === 'solution-architecture') {
    return {
      schemaVersion: 1,
      meta: { ...metaBase, type: 'solution-architecture' },
      body: emptySadBody()
    }
  }

  return {
    schemaVersion: 1,
    meta: { ...metaBase, type: 'adr' },
    body: emptyAdrBody()
  }
}

export function createVisioDocument(input: {
  title: string
  originalFileName: string
  extension: VisioExtension
  sizeBytes: number
  now?: Date
}): VisioDocument {
  const timestamp = (input.now ?? new Date()).toISOString()
  return {
    schemaVersion: 1,
    meta: {
      id: crypto.randomUUID(),
      type: 'visio',
      title: input.title.trim(),
      status: 'draft',
      version: '0.1.0',
      business: '',
      system: '',
      author: '',
      tags: [],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    body: {
      originalFileName: input.originalFileName,
      extension: input.extension,
      sizeBytes: input.sizeBytes,
      notes: ''
    }
  }
}

export function documentTypeLabel(type: DocumentType): string {
  switch (type) {
    case 'solution-architecture':
      return 'Solution architecture'
    case 'adr':
      return 'ADR'
    case 'visio':
      return 'Visio drawing'
  }
}
