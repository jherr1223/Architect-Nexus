import type { JSX } from 'react'
import { FilePlus, FolderOpen, Search, Trash2 } from 'lucide-react'
import type { DocumentMeta } from '@shared/schemas/document'
import { GROUP_BY_OPTIONS, groupDocuments, isGroupBy, type GroupBy } from '@shared/documents/groupDocuments'
import { documentTypeLabel } from '@shared/templates/createDocument'
import { statusLabel } from '@shared/labels'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Separator } from '@renderer/components/ui/separator'
import { cn } from '@renderer/lib/utils'

interface DocumentSidebarProps {
  workspacePath: string
  documents: DocumentMeta[]
  activeId: string | null
  search: string
  groupBy: GroupBy
  onSearchChange: (value: string) => void
  onGroupByChange: (value: GroupBy) => void
  onCreate: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onChangeWorkspace: () => void
}

function groupByLabel(groupBy: GroupBy): string {
  switch (groupBy) {
    case 'type':
      return 'Type'
    case 'status':
      return 'Status'
    case 'business':
      return 'Business'
    case 'system':
      return 'System'
  }
}

export function DocumentSidebar({
  workspacePath,
  documents,
  activeId,
  search,
  groupBy,
  onSearchChange,
  onGroupByChange,
  onCreate,
  onSelect,
  onDelete,
  onChangeWorkspace
}: DocumentSidebarProps): JSX.Element {
  const groups = groupDocuments(documents, groupBy)
  const folderName = workspacePath.split(/[/\\]/).filter(Boolean).at(-1) ?? workspacePath

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r bg-card">
      <div className="px-4 pb-3 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">Solution Arch</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight">Documents</h1>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2 truncate text-left text-xs text-muted-foreground hover:text-foreground"
          onClick={onChangeWorkspace}
          title={workspacePath}
        >
          <FolderOpen className="size-3.5 shrink-0" />
          <span className="truncate">{folderName}</span>
        </button>
      </div>
      <div className="px-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search documents"
            className="pl-8"
          />
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="group-by" className="text-xs text-muted-foreground">
            Group by
          </Label>
          <select
            id="group-by"
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={groupBy}
            onChange={(event) => {
              if (isGroupBy(event.target.value)) {
                onGroupByChange(event.target.value)
              }
            }}
          >
            {GROUP_BY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {groupByLabel(option)}
              </option>
            ))}
          </select>
        </div>
        <Button className="mt-3 w-full" onClick={onCreate}>
          <FilePlus />
          New document
        </Button>
      </div>
      <Separator className="mt-4" />
      <div className="min-h-0 flex-1 overflow-auto px-2 py-3">
        {groups.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">None yet</p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="mb-5">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.documents.map((document) => (
                  <div
                    key={document.id}
                    className={cn(
                      'group flex items-start gap-1 rounded-lg px-2 py-2 hover:bg-muted/80',
                      activeId === document.id && 'bg-accent'
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onSelect(document.id)}
                    >
                      <p className="truncate text-sm font-medium">{document.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={document.status}>{statusLabel(document.status)}</Badge>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {documentTypeLabel(document.type)}
                          {groupBy !== 'business' && document.business.trim()
                            ? ` · ${document.business.trim()}`
                            : null}
                        </span>
                      </div>
                    </button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => onDelete(document.id)}
                      aria-label={`Delete ${document.title}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
