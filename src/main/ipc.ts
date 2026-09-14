import fs from 'node:fs'
import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { ZodError } from 'zod'
import {
  createDocumentInputSchema,
  documentIdSchema,
  isVisioDocument,
  parseStoredDocument
} from '@shared/schemas/document'
import { createStoredDocument } from '@shared/templates/createDocument'
import { visioExtensions } from '@shared/visio/files'
import { loadSettings, saveSettings } from './settings'
import { WorkspaceStore } from './store/workspaceStore'

let store: WorkspaceStore | null = null

function requireStore(): WorkspaceStore {
  if (!store) {
    throw new Error('Open a workspace folder before managing documents')
  }
  return store
}

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return 'Document failed validation'
  }
  return error instanceof Error ? error.message : 'Unexpected error'
}

async function invoke<T>(work: () => T | Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    throw new Error(errorMessage(error))
  }
}

async function pickVisioFile(event: Electron.IpcMainInvokeEvent): Promise<string | null> {
  const window = BrowserWindow.fromWebContents(event.sender)
  const options = {
    title: 'Upload a Visio drawing',
    properties: ['openFile'] as Array<'openFile'>,
    filters: [
      {
        name: 'Visio drawings',
        extensions: [...visioExtensions]
      }
    ]
  }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0] ?? null
}

export function restoreWorkspace(): string | null {
  const settings = loadSettings()
  const workspacePath = settings.workspacePath
  if (!workspacePath || !fs.existsSync(workspacePath) || !fs.statSync(workspacePath).isDirectory()) {
    store = null
    return null
  }
  store = new WorkspaceStore(workspacePath)
  return store.getRoot()
}

// @mitigates SolutionArch:IPC against untrusted renderer payloads with Zod validation on every handler
export function registerIpc(): void {
  ipcMain.handle('workspace:get', () => invoke(() => store?.getRoot() ?? restoreWorkspace()))

  ipcMain.handle('workspace:select', (event) =>
    invoke(async () => {
      const window = BrowserWindow.fromWebContents(event.sender)
      const options = {
        title: 'Choose a workspace folder',
        properties: ['openDirectory', 'createDirectory'] as Array<
          'openDirectory' | 'createDirectory'
        >
      }
      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options)
      if (result.canceled || result.filePaths.length === 0) {
        return store?.getRoot() ?? null
      }
      const selected = result.filePaths[0]
      if (!selected) {
        return store?.getRoot() ?? null
      }
      store = new WorkspaceStore(selected)
      await store.ensureLayout()
      saveSettings({ workspacePath: store.getRoot() })
      return store.getRoot()
    })
  )

  ipcMain.handle('documents:list', () => invoke(() => requireStore().list()))

  ipcMain.handle('documents:get', (_event, id: unknown) =>
    invoke(() => requireStore().get(documentIdSchema.parse(id)))
  )

  ipcMain.handle('documents:create', (_event, input: unknown) =>
    invoke(() => {
      const parsed = createDocumentInputSchema.parse(input)
      return requireStore().save(createStoredDocument(parsed))
    })
  )

  ipcMain.handle('documents:save', (_event, payload: unknown) =>
    invoke(() => requireStore().save(parseStoredDocument(payload)))
  )

  ipcMain.handle('documents:delete', (_event, id: unknown) =>
    invoke(async () => {
      await requireStore().delete(documentIdSchema.parse(id))
      return { ok: true as const }
    })
  )

  ipcMain.handle('documents:exportMarkdown', (_event, id: unknown) =>
    invoke(() => requireStore().exportMarkdown(documentIdSchema.parse(id)))
  )

  ipcMain.handle('documents:importVisio', (event, title: unknown) =>
    invoke(async () => {
      const source = await pickVisioFile(event)
      if (!source) {
        return null
      }
      const optionalTitle =
        typeof title === 'string' && title.trim().length > 0 ? title.trim().slice(0, 200) : undefined
      return requireStore().importVisio(source, optionalTitle)
    })
  )

  ipcMain.handle('documents:replaceVisio', (event, id: unknown) =>
    invoke(async () => {
      const source = await pickVisioFile(event)
      if (!source) {
        return null
      }
      return requireStore().replaceVisio(documentIdSchema.parse(id), source)
    })
  )

  ipcMain.handle('documents:openVisio', (_event, id: unknown) =>
    invoke(async () => {
      const document = await requireStore().get(documentIdSchema.parse(id))
      if (!isVisioDocument(document)) {
        throw new Error('That document is not a Visio drawing')
      }
      const filePath = requireStore().visioAbsolutePath(document)
      const error = await shell.openPath(filePath)
      if (error) {
        throw new Error('Could not open the drawing. Make sure Visio is installed.')
      }
    })
  )

  ipcMain.handle('documents:visioPreview', (_event, id: unknown) =>
    invoke(() => requireStore().visioPreview(documentIdSchema.parse(id)))
  )
}
