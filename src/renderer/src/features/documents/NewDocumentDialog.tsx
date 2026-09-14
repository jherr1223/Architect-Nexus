import { useState, type JSX } from 'react'
import type { CreateDocumentInput, DocumentType } from '@shared/schemas/document'
import { templates } from '@shared/templates/definitions'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { cn } from '@renderer/lib/utils'

interface NewDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreateDocumentInput) => Promise<void>
  onImportVisio: (title?: string) => Promise<boolean>
}

export function NewDocumentDialog({
  open,
  onOpenChange,
  onCreate,
  onImportVisio
}: NewDocumentDialogProps): JSX.Element {
  const [type, setType] = useState<DocumentType>('solution-architecture')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(): Promise<void> {
    const trimmed = title.trim()
    setBusy(true)
    setError(null)
    try {
      if (type === 'visio') {
        const imported = await onImportVisio(trimmed || undefined)
        if (!imported) {
          return
        }
      } else {
        if (!trimmed) {
          setError('Give the document a title.')
          setBusy(false)
          return
        }
        await onCreate({ type, title: trimmed })
      }
      setTitle('')
      setType('solution-architecture')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the document.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Create a structured document or upload a Visio drawing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.values(templates).map((template) => (
            <button
              key={template.type}
              type="button"
              onClick={() => setType(template.type)}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors hover:border-primary',
                type === template.type ? 'border-primary bg-accent' : 'border-border bg-card'
              )}
            >
              <p className="font-medium">{template.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="document-title">{type === 'visio' ? 'Title (optional)' : 'Title'}</Label>
          <Input
            id="document-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              type === 'visio'
                ? 'Defaults to the Visio file name'
                : 'e.g. Customer onboarding platform'
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void submit()
              }
            }}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={busy}>
            {type === 'visio' ? 'Upload Visio file' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
