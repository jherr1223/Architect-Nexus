import { describe, expect, it } from 'vitest'
import { isAdrDocument, parseStoredDocument, storedDocumentSchema } from '@shared/schemas/document'
import { createStoredDocument } from '@shared/templates/createDocument'
import { documentToMarkdown } from '@shared/markdown/toMarkdown'

describe('stored document schemas', () => {
  it('accepts a valid solution architecture document', () => {
    const document = createStoredDocument({
      type: 'solution-architecture',
      title: 'Payments platform'
    })
    const parsed = parseStoredDocument(document)
    expect(parsed.meta.type).toBe('solution-architecture')
    expect(parsed.meta.title).toBe('Payments platform')
    expect(parsed.meta.business).toBe('')
    expect(parsed.schemaVersion).toBe(1)
  })

  it('defaults a missing business field on older documents', () => {
    const document = createStoredDocument({
      type: 'adr',
      title: 'Choose a broker'
    })
    const result = parseStoredDocument({
      ...document,
      meta: {
        id: document.meta.id,
        type: document.meta.type,
        title: document.meta.title,
        status: document.meta.status,
        version: document.meta.version,
        system: document.meta.system,
        author: document.meta.author,
        tags: document.meta.tags,
        createdAt: document.meta.createdAt,
        updatedAt: document.meta.updatedAt
      }
    })
    expect(result.meta.business).toBe('')
  })

  it('accepts a valid ADR', () => {
    const document = createStoredDocument({
      type: 'adr',
      title: 'Use event-driven integration'
    })
    const parsed = parseStoredDocument(document)
    expect(parsed.meta.type).toBe('adr')
    expect(isAdrDocument(parsed)).toBe(true)
    if (isAdrDocument(parsed)) {
      expect(parsed.body.alternatives).toEqual([])
      expect(parsed.body.approvers).toEqual([])
    }
  })

  it('defaults a missing approvers list on older ADRs', () => {
    const document = createStoredDocument({
      type: 'adr',
      title: 'Choose a broker'
    })
    if (!isAdrDocument(document)) {
      throw new Error('expected ADR')
    }
    const result = parseStoredDocument({
      ...document,
      body: {
        context: document.body.context,
        decision: document.body.decision,
        consequences: document.body.consequences,
        alternatives: document.body.alternatives
      }
    })
    expect(isAdrDocument(result)).toBe(true)
    if (isAdrDocument(result)) {
      expect(result.body.approvers).toEqual([])
    }
  })

  it('renders ADR approvers in markdown', () => {
    const document = createStoredDocument({
      type: 'adr',
      title: 'Choose a broker'
    })
    if (!isAdrDocument(document)) {
      throw new Error('expected ADR')
    }
    const parsed = parseStoredDocument({
      ...document,
      body: {
        ...document.body,
        approvers: [
          { id: crypto.randomUUID(), name: 'Alex Rivera', kind: 'technical' },
          { id: crypto.randomUUID(), name: 'Jordan Lee', kind: 'business' }
        ]
      }
    })
    const markdown = documentToMarkdown(parsed)
    expect(markdown).toContain('## Approvers')
    expect(markdown).toContain('Alex Rivera')
    expect(markdown).toContain('Technical approver')
    expect(markdown).toContain('Jordan Lee')
    expect(markdown).toContain('Business approver')
  })

  it('rejects unknown fields', () => {
    const document = createStoredDocument({
      type: 'adr',
      title: 'Choose a broker'
    })
    const result = storedDocumentSchema.safeParse({
      ...document,
      extra: true
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid document id', () => {
    const document = createStoredDocument({
      type: 'adr',
      title: 'Choose a broker'
    })
    const result = storedDocumentSchema.safeParse({
      ...document,
      meta: { ...document.meta, id: '../escape' }
    })
    expect(result.success).toBe(false)
  })

  it('rejects an ADR body on a solution architecture document', () => {
    const document = createStoredDocument({
      type: 'solution-architecture',
      title: 'Mismatched body'
    })
    const result = storedDocumentSchema.safeParse({
      ...document,
      body: {
        context: '',
        decision: '',
        consequences: '',
        alternatives: []
      }
    })
    expect(result.success).toBe(false)
  })

  it('accepts a visio document', () => {
    const parsed = parseStoredDocument({
      schemaVersion: 1,
      meta: {
        id: crypto.randomUUID(),
        type: 'visio',
        title: 'Network diagram',
        status: 'draft',
        version: '0.1.0',
        business: 'Georgia-Pacific',
        system: 'Billing',
        author: '',
        tags: [],
        createdAt: '2026-09-14T12:00:00.000Z',
        updatedAt: '2026-09-14T12:00:00.000Z'
      },
      body: {
        originalFileName: 'Network diagram.vsdx',
        extension: 'vsdx',
        sizeBytes: 2048,
        notes: 'Shows plant connectivity.'
      }
    })
    expect(parsed.meta.type).toBe('visio')
    expect(documentToMarkdown(parsed)).toContain('Network diagram.vsdx')
  })

  it('renders markdown for a new document', () => {
    const document = createStoredDocument({
      type: 'solution-architecture',
      title: 'Payments platform'
    })
    const markdown = documentToMarkdown(document)
    expect(markdown).toContain('# Payments platform')
    expect(markdown).toContain('**Business:**')
    expect(markdown).toContain('## Context')
  })
})
