import { useEffect, useState, type JSX } from 'react'
import { ExternalLink } from 'lucide-react'
import type { VisioPreviewPayload } from '@shared/api'
import { Button } from '@renderer/components/ui/button'

interface VisioPreviewProps {
  id: string
}

export function VisioPreview({ id }: VisioPreviewProps): JSX.Element {
  const [preview, setPreview] = useState<VisioPreviewPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    void window.api.documents
      .visioPreview(id)
      .then((result) => {
        if (!cancelled) {
          setPreview(result)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not preview this drawing.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="flex h-full flex-col overflow-auto bg-[#fbfaf6] px-8 py-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Drawing preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview?.originalFileName ?? 'Loading drawing…'}
          </p>
        </div>
        <Button type="button" onClick={() => void window.api.documents.openVisio(id)}>
          <ExternalLink />
          Open in Visio
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {preview?.thumbnail ? (
        <img
          alt={`Preview of ${preview.originalFileName}`}
          className="max-h-[70vh] w-full rounded-xl border bg-white object-contain p-3 shadow-sm"
          src={`data:${preview.thumbnail.mime};base64,${preview.thumbnail.base64}`}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed bg-card/70 px-6 py-16 text-center">
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            This Visio file is stored in the workspace. An in-app thumbnail was not available, so
            open it in Visio to view the drawing.
          </p>
        </div>
      )}
    </div>
  )
}
