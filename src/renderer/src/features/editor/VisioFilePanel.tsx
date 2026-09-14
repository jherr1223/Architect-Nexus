import { useState, type JSX } from 'react'
import { Upload } from 'lucide-react'
import { isVisioDocument, type VisioDocument } from '@shared/schemas/document'
import { Button } from '@renderer/components/ui/button'

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

interface VisioFilePanelProps {
  document: VisioDocument
  onReplaced: (document: VisioDocument) => void
}

export function VisioFilePanel({ document, onReplaced }: VisioFilePanelProps): JSX.Element {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function replace(): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const next = await window.api.documents.replaceVisio(document.meta.id)
      if (next && isVisioDocument(next)) {
        onReplaced(next)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not replace the Visio file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="scroll-mt-8 rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Visio file</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The drawing is stored in this workspace. Replace it to upload a new version.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{document.body.originalFileName}</p>
          <p className="text-xs text-muted-foreground">
            .{document.body.extension} · {formatBytes(document.body.sizeBytes)}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void replace()} disabled={busy}>
          <Upload />
          Replace file
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  )
}
