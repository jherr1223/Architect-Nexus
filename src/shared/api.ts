import type { CreateDocumentInput, DocumentMeta, StoredDocument } from '@shared/schemas/document'

export interface VisioPreviewPayload {
  originalFileName: string
  extension: string
  sizeBytes: number
  thumbnail: { mime: 'image/png' | 'image/jpeg'; base64: string } | null
}

export interface DesktopApi {
  workspace: {
    get: () => Promise<string | null>
    select: () => Promise<string | null>
  }
  documents: {
    list: () => Promise<DocumentMeta[]>
    get: (id: string) => Promise<StoredDocument>
    create: (input: CreateDocumentInput) => Promise<StoredDocument>
    save: (document: StoredDocument) => Promise<StoredDocument>
    delete: (id: string) => Promise<{ ok: true }>
    exportMarkdown: (id: string) => Promise<string>
    importVisio: (title?: string) => Promise<StoredDocument | null>
    replaceVisio: (id: string) => Promise<StoredDocument | null>
    openVisio: (id: string) => Promise<void>
    visioPreview: (id: string) => Promise<VisioPreviewPayload>
  }
}
