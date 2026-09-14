import type { JSX } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

interface OpenWorkspaceProps {
  onOpen: () => void
  error?: string | null
}

export function OpenWorkspace({ onOpen, error }: OpenWorkspaceProps): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center bg-background px-6">
      <div className="max-w-lg rounded-2xl border bg-card p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Solution Arch</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your architecture library</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Choose a folder to store solution architecture documents and ADRs as portable JSON files.
          You can move, back up, or version that folder however you like.
        </p>
        <Button className="mt-6" size="lg" onClick={onOpen}>
          <FolderOpen />
          Open workspace folder
        </Button>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}
