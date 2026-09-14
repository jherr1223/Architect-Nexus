import type { JSX } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { documentToMarkdown } from '@shared/markdown/toMarkdown'
import type { StoredDocument } from '@shared/schemas/document'

interface DocumentPreviewProps {
  document: StoredDocument
}

// @mitigates SolutionArch:Renderer:Preview against XSS with react-markdown and HTML skipped
export function DocumentPreview({ document }: DocumentPreviewProps): JSX.Element {
  const markdown = documentToMarkdown(document)

  return (
    <div className="h-full overflow-auto bg-[#fbfaf6] px-8 py-8">
      <article className="prose-sa mx-auto max-w-2xl">
        <Markdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          components={{
            h1: ({ children }) => (
              <h1 className="mb-4 text-3xl font-semibold tracking-tight text-stone-900">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-8 text-xl font-semibold text-stone-900">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-base font-semibold text-stone-800">{children}</h3>
            ),
            p: ({ children }) => <p className="mb-3 leading-7 text-stone-700">{children}</p>,
            ul: ({ children }) => (
              <ul className="mb-4 list-disc space-y-1 pl-5 text-stone-700">{children}</ul>
            ),
            li: ({ children }) => <li className="leading-6">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
            em: ({ children }) => <em className="text-stone-500">{children}</em>
          }}
        >
          {markdown}
        </Markdown>
      </article>
    </div>
  )
}
