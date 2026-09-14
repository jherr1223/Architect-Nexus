import { describe, expect, it } from 'vitest'
import type { DocumentMeta } from '@shared/schemas/document'
import { groupDocuments } from './groupDocuments'

function meta(overrides: Partial<DocumentMeta> & Pick<DocumentMeta, 'title'>): DocumentMeta {
  return {
    id: crypto.randomUUID(),
    type: 'adr',
    status: 'draft',
    version: '0.1.0',
    business: '',
    system: '',
    author: '',
    tags: [],
    createdAt: '2026-09-14T12:00:00.000Z',
    updatedAt: '2026-09-14T12:00:00.000Z',
    ...overrides
  }
}

describe('groupDocuments', () => {
  it('groups by status in lifecycle order', () => {
    const documents = [
      meta({ title: 'A', status: 'approved' }),
      meta({ title: 'B', status: 'draft' }),
      meta({ title: 'C', status: 'in-review' })
    ]
    const groups = groupDocuments(documents, 'status')
    expect(groups.map((group) => group.title)).toEqual(['Draft', 'In review', 'Approved'])
  })

  it('groups by business and puts unassigned last', () => {
    const documents = [
      meta({ title: 'None' }),
      meta({ title: 'Georgia-Pacific', business: 'Georgia-Pacific' }),
      meta({ title: 'Same business', business: 'georgia-pacific' }),
      meta({ title: 'Koch', business: 'Koch' })
    ]
    const groups = groupDocuments(documents, 'business')
    expect(groups.map((group) => group.title)).toEqual([
      'Georgia-Pacific',
      'Koch',
      'Unassigned business'
    ])
    expect(groups[0]?.documents).toHaveLength(2)
  })

  it('groups Visio drawings with other document types', () => {
    const documents = [
      meta({ title: 'ADR', type: 'adr' }),
      meta({ title: 'Diagram', type: 'visio' }),
      meta({ title: 'SAD', type: 'solution-architecture' })
    ]
    const groups = groupDocuments(documents, 'type')
    expect(groups.map((group) => group.title)).toEqual([
      'Solution architecture',
      'ADR',
      'Visio drawing'
    ])
  })

  it('groups by system and puts unassigned last', () => {
    const documents = [
      meta({ title: 'Unspecified' }),
      meta({ title: 'Billing', system: 'Billing' }),
      meta({ title: 'CRM', system: 'CRM' })
    ]
    const groups = groupDocuments(documents, 'system')
    expect(groups.map((group) => group.title)).toEqual(['Billing', 'CRM', 'Unassigned system'])
  })
})
