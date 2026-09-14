import type { JSX } from 'react'
import { templateForDocument } from '@shared/templates/definitions'
import { isVisioDocument, type StoredDocument } from '@shared/schemas/document'
import { FieldRenderer } from './FieldRenderer'
import { VisioFilePanel } from './VisioFilePanel'
import { setBodyField, setMetaField, setRepeatableItemField } from './updateDocument'

interface DocumentEditorProps {
  document: StoredDocument
  onChange: (document: StoredDocument) => void
}

export function DocumentEditor({ document, onChange }: DocumentEditorProps): JSX.Element {
  const template = templateForDocument(document)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-16">
      {isVisioDocument(document) ? (
        <VisioFilePanel
          document={document}
          onReplaced={(next) => onChange(next)}
        />
      ) : null}
      {template.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-8 rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
            {section.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            ) : null}
          </div>
          <div className="grid gap-4">
            {section.fields.map((field) => {
              const source = section.base === 'meta' ? document.meta : document.body
              const value = (source as Record<string, unknown>)[field.key]

              return (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={value}
                  onChange={(next) => {
                    if (section.base === 'meta') {
                      onChange(setMetaField(document, field.key, next))
                      return
                    }
                    onChange(setBodyField(document, field.key, next))
                  }}
                  onAddItem={() => {
                    const createItem = field.createItem
                    if (!createItem) {
                      return
                    }
                    const current = Array.isArray(value) ? value : []
                    onChange(setBodyField(document, field.key, [...current, createItem()]))
                  }}
                  onRemoveItem={(index) => {
                    const current = Array.isArray(value) ? [...value] : []
                    current.splice(index, 1)
                    onChange(setBodyField(document, field.key, current))
                  }}
                  onItemChange={(index, key, next) => {
                    onChange(setRepeatableItemField(document, field.key, index, key, next))
                  }}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
