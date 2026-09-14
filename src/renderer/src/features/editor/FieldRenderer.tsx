import type { JSX } from 'react'
import { X } from 'lucide-react'
import type { FieldConfig } from '@shared/templates/definitions'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { cn } from '@renderer/lib/utils'

interface FieldRendererProps {
  field: FieldConfig
  value: unknown
  onChange: (value: unknown) => void
  onItemChange?: (index: number, key: string, value: unknown) => void
  onAddItem?: () => void
  onRemoveItem?: (index: number) => void
}

export function FieldRenderer({
  field,
  value,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem
}: FieldRendererProps): JSX.Element {
  if (field.type === 'repeatable') {
    const items = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{field.label}</Label>
          <Button type="button" size="sm" variant="outline" onClick={onAddItem}>
            {field.addLabel ?? 'Add'}
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
            Nothing added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={String(item.id ?? index)} className="rounded-lg border bg-card p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {index + 1}
                  </p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemoveItem?.(index)}
                    aria-label="Remove item"
                  >
                    <X />
                  </Button>
                </div>
                <div className="grid gap-3">
                  {field.itemFields?.map((itemField) => (
                    <FieldRenderer
                      key={itemField.key}
                      field={itemField}
                      value={item[itemField.key]}
                      onChange={(next) => onItemChange?.(index, itemField.key, next)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (field.type === 'tags') {
    const tags = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
              onClick={() => onChange(tags.filter((item) => item !== tag))}
            >
              {tag}
              <X className="size-3" />
            </button>
          ))}
        </div>
        <Input
          id={field.key}
          placeholder={field.placeholder}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') {
              return
            }
            event.preventDefault()
            const next = event.currentTarget.value.trim()
            if (!next || tags.includes(next) || tags.length >= 20) {
              return
            }
            onChange([...tags, next.slice(0, 40)])
            event.currentTarget.value = ''
          }}
        />
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <select
          id={field.key}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Textarea
          id={field.key}
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>{field.label}</Label>
      <Input
        id={field.key}
        value={String(value ?? '')}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
