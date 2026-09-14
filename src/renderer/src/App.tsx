import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { Download, ExternalLink, Eye, EyeOff } from 'lucide-react'
import {
  isVisioDocument,
  type CreateDocumentInput,
  type DocumentMeta,
  type StoredDocument
} from '@shared/schemas/document'
import type { GroupBy } from '@shared/documents/groupDocuments'
import { statusLabel } from '@shared/labels'
import { documentTypeLabel } from '@shared/templates/createDocument'
import { templateForDocument } from '@shared/templates/definitions'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { DocumentSidebar } from '@renderer/features/documents/DocumentSidebar'
import { NewDocumentDialog } from '@renderer/features/documents/NewDocumentDialog'
import { DocumentEditor } from '@renderer/features/editor/DocumentEditor'
import { DocumentPreview } from '@renderer/features/preview/DocumentPreview'
import { VisioPreview } from '@renderer/features/preview/VisioPreview'
import { OpenWorkspace } from '@renderer/features/workspace/OpenWorkspace'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function matchesSearch(document: DocumentMeta, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) {
    return true
  }
  const haystack = [
    document.title,
    document.business,
    document.system,
    document.author,
    document.status,
    ...document.tags
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

export default function App(): JSX.Element {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentMeta[]>([])
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('type')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDocument, setActiveDocument] = useState<StoredDocument | null>(null)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [exportPath, setExportPath] = useState<string | null>(null)
  const dirtyRef = useRef(false)
  const skipFirstSave = useRef(true)

  async function refreshList(): Promise<void> {
    const list = await window.api.documents.list()
    setDocuments(list)
  }

  useEffect(() => {
    void window.api.workspace.get().then((path) => {
      if (path) {
        setWorkspacePath(path)
      }
    })
  }, [])

  useEffect(() => {
    if (!workspacePath) {
      return
    }
    void refreshList().catch((error: unknown) => {
      setWorkspaceError(error instanceof Error ? error.message : 'Could not read documents')
    })
  }, [workspacePath])

  useEffect(() => {
    if (!activeDocument || skipFirstSave.current || !dirtyRef.current) {
      skipFirstSave.current = false
      return
    }

    const handle = window.setTimeout(() => {
      setSaveState('saving')
      void window.api.documents
        .save(activeDocument)
        .then(async () => {
          dirtyRef.current = false
          setSaveState('saved')
          await refreshList()
        })
        .catch(() => {
          setSaveState('error')
        })
    }, 500)

    return () => window.clearTimeout(handle)
  }, [activeDocument])

  const visibleDocuments = useMemo(
    () => documents.filter((document) => matchesSearch(document, search)),
    [documents, search]
  )

  async function openWorkspace(): Promise<void> {
    setWorkspaceError(null)
    try {
      const selected = await window.api.workspace.select()
      if (selected) {
        setWorkspacePath(selected)
        setActiveId(null)
        setActiveDocument(null)
      }
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : 'Could not open that folder')
    }
  }

  async function selectDocument(id: string): Promise<void> {
    const document = await window.api.documents.get(id)
    skipFirstSave.current = true
    dirtyRef.current = false
    setActiveId(id)
    setActiveDocument(document)
    setSaveState('saved')
    setExportPath(null)
  }

  async function importVisio(title?: string): Promise<boolean> {
    const document = await window.api.documents.importVisio(title)
    if (!document) {
      return false
    }
    await refreshList()
    skipFirstSave.current = true
    dirtyRef.current = false
    setActiveId(document.meta.id)
    setActiveDocument(document)
    setSaveState('saved')
    return true
  }

  async function createDocument(input: CreateDocumentInput): Promise<void> {
    const document = await window.api.documents.create(input)
    await refreshList()
    skipFirstSave.current = true
    dirtyRef.current = false
    setActiveId(document.meta.id)
    setActiveDocument(document)
    setSaveState('saved')
  }

  async function deleteDocument(id: string): Promise<void> {
    const target = documents.find((document) => document.id === id)
    const accepted = window.confirm(
      `Delete “${target?.title ?? 'this document'}”? This removes it from the workspace.`
    )
    if (!accepted) {
      return
    }
    await window.api.documents.delete(id)
    if (activeId === id) {
      setActiveId(null)
      setActiveDocument(null)
    }
    await refreshList()
  }

  async function exportMarkdown(): Promise<void> {
    if (!activeId) {
      return
    }
    const path = await window.api.documents.exportMarkdown(activeId)
    setExportPath(path)
  }

  if (!workspacePath) {
    return <OpenWorkspace onOpen={() => void openWorkspace()} error={workspaceError} />
  }

  return (
    <div className="flex h-full overflow-hidden">
      <DocumentSidebar
        workspacePath={workspacePath}
        documents={visibleDocuments}
        activeId={activeId}
        search={search}
        groupBy={groupBy}
        onSearchChange={setSearch}
        onGroupByChange={setGroupBy}
        onCreate={() => setCreateOpen(true)}
        onSelect={(id) => void selectDocument(id)}
        onDelete={(id) => void deleteDocument(id)}
        onChangeWorkspace={() => void openWorkspace()}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {activeDocument ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b bg-card/90 px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold">{activeDocument.meta.title}</h2>
                  <Badge variant={activeDocument.meta.status}>
                    {statusLabel(activeDocument.meta.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {documentTypeLabel(activeDocument.meta.type)}
                  {activeDocument.meta.business.trim()
                    ? ` · ${activeDocument.meta.business.trim()}`
                    : null}
                  {activeDocument.meta.system.trim() ? ` · ${activeDocument.meta.system.trim()}` : null}
                  {saveState === 'saving' ? ' · Saving' : null}
                  {saveState === 'saved' ? ' · Saved' : null}
                  {saveState === 'error' ? ' · Save failed — check required fields' : null}
                  {exportPath ? ' · Exported Markdown' : null}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPreviewOpen((open) => !open)}>
                  {previewOpen ? <EyeOff /> : <Eye />}
                  {previewOpen ? 'Hide preview' : 'Show preview'}
                </Button>
                {isVisioDocument(activeDocument) ? (
                  <Button variant="secondary" onClick={() => void window.api.documents.openVisio(activeDocument.meta.id)}>
                    <ExternalLink />
                    Open in Visio
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={() => void exportMarkdown()}>
                  <Download />
                  Export Markdown
                </Button>
              </div>
            </header>
            <div className="flex min-h-0 flex-1">
              <div className="min-w-0 flex-1 overflow-auto px-8 py-6">
                <nav className="mb-6 flex flex-wrap gap-2">
                  {templateForDocument(activeDocument).sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
                <DocumentEditor
                  document={activeDocument}
                  onChange={(next) => {
                    dirtyRef.current = true
                    setActiveDocument(next)
                  }}
                />
              </div>
              {previewOpen ? (
                <div className="w-[42%] shrink-0 border-l">
                  {isVisioDocument(activeDocument) ? (
                    <VisioPreview id={activeDocument.meta.id} />
                  ) : (
                    <DocumentPreview document={activeDocument} />
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-8">
            <div className="max-w-md rounded-2xl border border-dashed bg-card/70 px-8 py-10 text-center">
              <h2 className="text-xl font-semibold">Select a document</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create a solution architecture document, ADR, or upload a Visio drawing. Your work
                auto-saves into the workspace folder.
              </p>
            </div>
          </div>
        )}
      </div>
      <NewDocumentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={createDocument}
        onImportVisio={importVisio}
      />
    </div>
  )
}
