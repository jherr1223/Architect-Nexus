import fs from 'node:fs/promises'
import path from 'node:path'
import {
  documentIdSchema,
  isVisioDocument,
  parseStoredDocument,
  type StoredDocument,
  type VisioDocument
} from '@shared/schemas/document'
import { documentToMarkdown } from '@shared/markdown/toMarkdown'
import { createVisioDocument } from '@shared/templates/createDocument'
import {
  VISIO_MAX_BYTES,
  assertVisioBuffer,
  safeOriginalFileName,
  titleFromVisioFileName,
  visioAttachmentName,
  visioExtensionFromFileName,
  type VisioExtension
} from '@shared/visio/files'
import { extractVisioThumbnail, type VisioThumbnail } from '@shared/visio/thumbnail'
import { assertPathInside } from './paths'

export interface VisioPreview {
  originalFileName: string
  extension: VisioExtension
  sizeBytes: number
  thumbnail: { mime: VisioThumbnail['mime']; base64: string } | null
}

export class WorkspaceStore {
  constructor(private readonly root: string) {
    this.root = path.resolve(root)
  }

  getRoot(): string {
    return this.root
  }

  documentsDir(): string {
    return path.join(this.root, 'documents')
  }

  filesDir(): string {
    return path.join(this.root, 'documents', 'files')
  }

  exportsDir(): string {
    return path.join(this.root, 'exports')
  }

  // @mitigates SolutionArch:Workspace:Store against path traversal with UUID ids and workspace containment
  documentPath(id: string): string {
    const safeId = documentIdSchema.parse(id)
    const target = path.join(this.documentsDir(), `${safeId}.json`)
    assertPathInside(this.root, target)
    return target
  }

  visioPath(id: string, extension: VisioExtension): string {
    const safeId = documentIdSchema.parse(id)
    const target = path.join(this.filesDir(), visioAttachmentName(safeId, extension))
    assertPathInside(this.root, target)
    return target
  }

  exportPath(id: string): string {
    const safeId = documentIdSchema.parse(id)
    const target = path.join(this.exportsDir(), `${safeId}.md`)
    assertPathInside(this.root, target)
    return target
  }

  async ensureLayout(): Promise<void> {
    await fs.mkdir(this.documentsDir(), { recursive: true })
    await fs.mkdir(this.filesDir(), { recursive: true })
    await fs.mkdir(this.exportsDir(), { recursive: true })
  }

  async list(): Promise<StoredDocument['meta'][]> {
    await this.ensureLayout()
    const entries = await fs.readdir(this.documentsDir(), { withFileTypes: true })
    const metas: StoredDocument['meta'][] = []

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) {
        continue
      }

      const id = entry.name.slice(0, -'.json'.length)
      const parsedId = documentIdSchema.safeParse(id)
      if (!parsedId.success) {
        continue
      }

      try {
        const document = await this.get(parsedId.data)
        metas.push(document.meta)
      } catch {
        continue
      }
    }

    return metas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  // @mitigates SolutionArch:Workspace:Store against malformed files with Zod parse on read
  async get(id: string): Promise<StoredDocument> {
    const filePath = this.documentPath(id)
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    return parseStoredDocument(parsed)
  }

  async save(document: StoredDocument): Promise<StoredDocument> {
    await this.ensureLayout()
    let body: StoredDocument['body'] = document.body
    if (isVisioDocument(document)) {
      const existing = await this.get(document.meta.id)
      if (!isVisioDocument(existing)) {
        throw new Error('That document is not a Visio drawing')
      }
      body = {
        ...existing.body,
        notes: document.body.notes
      }
    }
    const validated = parseStoredDocument({
      schemaVersion: document.schemaVersion,
      meta: {
        ...document.meta,
        title: document.meta.title.trim(),
        updatedAt: new Date().toISOString()
      },
      body
    })
    const filePath = this.documentPath(validated.meta.id)
    await fs.writeFile(filePath, `${JSON.stringify(validated, null, 2)}\n`, 'utf8')
    return validated
  }

  async importVisio(sourcePath: string, title?: string): Promise<VisioDocument> {
    await this.ensureLayout()
    const originalFileName = safeOriginalFileName(sourcePath)
    const extension = visioExtensionFromFileName(originalFileName)
    const stat = await fs.stat(sourcePath)
    if (!stat.isFile()) {
      throw new Error('Choose a Visio file')
    }
    if (stat.size > VISIO_MAX_BYTES) {
      throw new Error('Visio files must be 50 MB or smaller')
    }
    const buffer = await fs.readFile(sourcePath)
    assertVisioBuffer(buffer, extension)
    const document = createVisioDocument({
      title: title?.trim() || titleFromVisioFileName(originalFileName),
      originalFileName,
      extension,
      sizeBytes: buffer.length
    })
    const validated = parseStoredDocument(document)
    if (!isVisioDocument(validated)) {
      throw new Error('That document is not a Visio drawing')
    }
    const attachmentPath = this.visioPath(validated.meta.id, extension)
    await fs.writeFile(attachmentPath, buffer)
    await fs.writeFile(
      this.documentPath(validated.meta.id),
      `${JSON.stringify(validated, null, 2)}\n`,
      'utf8'
    )
    return validated
  }

  async replaceVisio(id: string, sourcePath: string): Promise<VisioDocument> {
    const existing = await this.get(id)
    if (!isVisioDocument(existing)) {
      throw new Error('That document is not a Visio drawing')
    }
    const originalFileName = safeOriginalFileName(sourcePath)
    const extension = visioExtensionFromFileName(originalFileName)
    const stat = await fs.stat(sourcePath)
    if (!stat.isFile()) {
      throw new Error('Choose a Visio file')
    }
    if (stat.size > VISIO_MAX_BYTES) {
      throw new Error('Visio files must be 50 MB or smaller')
    }
    const buffer = await fs.readFile(sourcePath)
    assertVisioBuffer(buffer, extension)
    const previousPath = this.visioPath(existing.meta.id, existing.body.extension)
    const nextPath = this.visioPath(existing.meta.id, extension)
    await fs.writeFile(nextPath, buffer)
    if (previousPath !== nextPath) {
      await fs.rm(previousPath, { force: true })
    }
    const updated = parseStoredDocument({
      ...existing,
      meta: {
        ...existing.meta,
        updatedAt: new Date().toISOString()
      },
      body: {
        ...existing.body,
        originalFileName,
        extension,
        sizeBytes: buffer.length
      }
    })
    if (!isVisioDocument(updated)) {
      throw new Error('That document is not a Visio drawing')
    }
    await fs.writeFile(this.documentPath(id), `${JSON.stringify(updated, null, 2)}\n`, 'utf8')
    return updated
  }

  visioAbsolutePath(document: VisioDocument): string {
    return this.visioPath(document.meta.id, document.body.extension)
  }

  async visioPreview(id: string): Promise<VisioPreview> {
    const document = await this.get(id)
    if (!isVisioDocument(document)) {
      throw new Error('That document is not a Visio drawing')
    }
    const filePath = this.visioPath(document.meta.id, document.body.extension)
    const buffer = await fs.readFile(filePath)
    const thumbnail = await extractVisioThumbnail(buffer, document.body.extension)
    return {
      originalFileName: document.body.originalFileName,
      extension: document.body.extension,
      sizeBytes: document.body.sizeBytes,
      thumbnail: thumbnail
        ? { mime: thumbnail.mime, base64: thumbnail.bytes.toString('base64') }
        : null
    }
  }

  async delete(id: string): Promise<void> {
    let extension: VisioExtension | null = null
    try {
      const document = await this.get(id)
      if (isVisioDocument(document)) {
        extension = document.body.extension
      }
    } catch {
      extension = null
    }
    await fs.rm(this.documentPath(id), { force: true })
    if (extension) {
      await fs.rm(this.visioPath(id, extension), { force: true })
    }
  }

  async exportMarkdown(id: string): Promise<string> {
    await this.ensureLayout()
    const document = await this.get(id)
    const markdown = documentToMarkdown(document)
    const filePath = this.exportPath(id)
    await fs.writeFile(filePath, markdown, 'utf8')
    return filePath
  }
}
