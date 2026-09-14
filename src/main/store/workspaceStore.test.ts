import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { isAdrDocument } from '@shared/schemas/document'
import { createStoredDocument } from '@shared/templates/createDocument'
import { isPathInside } from './paths'
import { WorkspaceStore } from './workspaceStore'

const tempDirs: string[] = []

function makeWorkspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-workspace-'))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe('workspace path confinement', () => {
  // @tests Path confinement for SolutionArch:Workspace:Store
  it('rejects paths that escape the workspace', () => {
    const root = path.join(os.tmpdir(), 'sa-root')
    expect(isPathInside(root, path.join(root, 'documents', 'a.json'))).toBe(true)
    expect(isPathInside(root, path.join(root, '..', 'outside.json'))).toBe(false)
    expect(isPathInside(root, path.parse(root).root)).toBe(false)
  })
})

describe('WorkspaceStore', () => {
  it('creates, lists, updates, and deletes a document', async () => {
    const store = new WorkspaceStore(makeWorkspace())
    const created = await store.save(
      createStoredDocument({ type: 'adr', title: 'Pick a message bus' })
    )

    const listed = await store.list()
    expect(listed).toHaveLength(1)
    expect(listed[0]?.title).toBe('Pick a message bus')

    const loaded = await store.get(created.meta.id)
    expect(isAdrDocument(loaded)).toBe(true)
    if (!isAdrDocument(loaded)) {
      throw new Error('expected ADR')
    }

    const updated = await store.save({
      ...loaded,
      meta: { ...loaded.meta, status: 'approved' }
    })
    expect(updated.meta.status).toBe('approved')
    expect(updated.meta.updatedAt >= loaded.meta.updatedAt).toBe(true)

    await store.delete(created.meta.id)
    expect(await store.list()).toHaveLength(0)
  })

  it('refuses non-uuid document ids', () => {
    const store = new WorkspaceStore(makeWorkspace())
    expect(() => store.documentPath('../secret')).toThrow()
    expect(() => store.documentPath('not-a-uuid')).toThrow()
  })

  it('persists solution architecture body fields across save and reload', async () => {
    const store = new WorkspaceStore(makeWorkspace())
    const created = await store.save(
      createStoredDocument({ type: 'solution-architecture', title: 'Billing' })
    )
    if (created.meta.type !== 'solution-architecture') {
      throw new Error('expected SAD')
    }
    const saved = await store.save({
      ...created,
      body: {
        ...created.body,
        context: 'Legacy billing cannot support usage-based plans.',
        goals: 'Ship a metered billing engine.'
      }
    })
    const loaded = await store.get(saved.meta.id)
    if (loaded.meta.type !== 'solution-architecture') {
      throw new Error('expected SAD')
    }
    expect(loaded.body.context).toContain('usage-based')
    expect(loaded.body.goals).toContain('metered')
  })

  it('writes markdown exports under the workspace', async () => {
    const root = makeWorkspace()
    const store = new WorkspaceStore(root)
    const created = await store.save(
      createStoredDocument({ type: 'solution-architecture', title: 'Billing' })
    )
    const exportPath = await store.exportMarkdown(created.meta.id)
    expect(isPathInside(root, exportPath)).toBe(true)
    const markdown = fs.readFileSync(exportPath, 'utf8')
    expect(markdown).toContain('# Billing')
  })

  it('imports, previews, and deletes a Visio drawing under the workspace', async () => {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    zip.file(
      'docProps/thumbnail.png',
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      )
    )
    const packed = Buffer.from(await zip.generateAsync({ type: 'uint8array' }))
    const root = makeWorkspace()
    const source = path.join(root, 'Network.vsdx')
    fs.writeFileSync(source, packed)
    const store = new WorkspaceStore(root)
    const imported = await store.importVisio(source, 'Network diagram')
    expect(imported.meta.type).toBe('visio')
    expect(imported.meta.title).toBe('Network diagram')
    expect(isPathInside(root, store.visioAbsolutePath(imported))).toBe(true)
    expect(fs.existsSync(store.visioAbsolutePath(imported))).toBe(true)

    const preview = await store.visioPreview(imported.meta.id)
    expect(preview.thumbnail?.mime).toBe('image/png')

    const saved = await store.save({
      ...imported,
      body: {
        ...imported.body,
        originalFileName: 'evil.vsdx',
        notes: 'Plant network'
      }
    })
    if (saved.meta.type !== 'visio') {
      throw new Error('expected visio')
    }
    expect(saved.body.originalFileName).toBe('Network.vsdx')
    expect(saved.body.notes).toBe('Plant network')

    await store.delete(imported.meta.id)
    expect(await store.list()).toHaveLength(0)
    expect(fs.existsSync(store.visioAbsolutePath(imported))).toBe(false)
  })
})
