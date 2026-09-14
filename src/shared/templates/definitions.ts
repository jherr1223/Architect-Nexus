import type { DocumentType, StoredDocument } from '@shared/schemas/document'

export type FieldType = 'text' | 'textarea' | 'select' | 'tags' | 'repeatable'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldConfig {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  help?: string
  options?: SelectOption[]
  itemFields?: FieldConfig[]
  addLabel?: string
  createItem?: () => Record<string, unknown>
}

export interface SectionConfig {
  id: string
  title: string
  description?: string
  base: 'meta' | 'body'
  fields: FieldConfig[]
}

export interface TemplateDefinition {
  type: DocumentType
  title: string
  description: string
  sections: SectionConfig[]
}

const statusOptions: SelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in-review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'deprecated', label: 'Deprecated' }
]

const priorityOptions: SelectOption[] = [
  { value: 'must', label: 'Must' },
  { value: 'should', label: 'Should' },
  { value: 'could', label: 'Could' }
]

const lowMedHigh: SelectOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

const overviewFields: FieldConfig[] = [
  { key: 'title', label: 'Title', type: 'text', placeholder: 'Document title' },
  { key: 'status', label: 'Status', type: 'select', options: statusOptions },
  { key: 'version', label: 'Version', type: 'text', placeholder: '0.1.0' },
  { key: 'business', label: 'Business', type: 'text', placeholder: 'Business or operating company' },
  { key: 'system', label: 'System / product', type: 'text', placeholder: 'Affected system' },
  { key: 'author', label: 'Author', type: 'text', placeholder: 'Your name' },
  { key: 'tags', label: 'Tags', type: 'tags', placeholder: 'Add a tag and press Enter' }
]

export const sadTemplate: TemplateDefinition = {
  type: 'solution-architecture',
  title: 'Solution Architecture Document',
  description: 'Guided sections for context, requirements, architecture, and risks.',
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Identity and lifecycle for this document.',
      base: 'meta',
      fields: overviewFields
    },
    {
      id: 'context',
      title: 'Context',
      description: 'Problem, drivers, and the environment this solution lives in.',
      base: 'body',
      fields: [
        {
          key: 'context',
          label: 'Context',
          type: 'textarea',
          placeholder: 'What problem are we solving, and for whom?'
        }
      ]
    },
    {
      id: 'goals',
      title: 'Goals',
      base: 'body',
      fields: [
        {
          key: 'goals',
          label: 'Goals',
          type: 'textarea',
          placeholder: 'What success looks like.'
        },
        {
          key: 'nonGoals',
          label: 'Non-goals',
          type: 'textarea',
          placeholder: 'What this solution will not address.'
        }
      ]
    },
    {
      id: 'stakeholders',
      title: 'Stakeholders',
      base: 'body',
      fields: [
        {
          key: 'stakeholders',
          label: 'Stakeholders',
          type: 'repeatable',
          addLabel: 'Add stakeholder',
          createItem: () => ({
            id: crypto.randomUUID(),
            name: '',
            role: '',
            interest: ''
          }),
          itemFields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'role', label: 'Role', type: 'text' },
            { key: 'interest', label: 'Interest', type: 'text' }
          ]
        }
      ]
    },
    {
      id: 'requirements',
      title: 'Requirements',
      base: 'body',
      fields: [
        {
          key: 'functionalRequirements',
          label: 'Functional requirements',
          type: 'repeatable',
          addLabel: 'Add requirement',
          createItem: () => ({
            id: crypto.randomUUID(),
            title: '',
            description: '',
            priority: 'should'
          }),
          itemFields: [
            { key: 'title', label: 'Title', type: 'text' },
            {
              key: 'priority',
              label: 'Priority',
              type: 'select',
              options: priorityOptions
            },
            { key: 'description', label: 'Description', type: 'textarea' }
          ]
        },
        {
          key: 'nonFunctionalRequirements',
          label: 'Non-functional requirements',
          type: 'repeatable',
          addLabel: 'Add NFR',
          createItem: () => ({
            id: crypto.randomUUID(),
            category: '',
            statement: '',
            metric: ''
          }),
          itemFields: [
            { key: 'category', label: 'Category', type: 'text', placeholder: 'Availability, security, latency…' },
            { key: 'metric', label: 'Metric', type: 'text', placeholder: 'How we will measure it' },
            { key: 'statement', label: 'Statement', type: 'textarea' }
          ]
        }
      ]
    },
    {
      id: 'architecture',
      title: 'Architecture',
      base: 'body',
      fields: [
        {
          key: 'currentArchitecture',
          label: 'Current architecture',
          type: 'textarea',
          placeholder: 'As-is: components, data, and constraints.'
        },
        {
          key: 'targetArchitecture',
          label: 'Target architecture',
          type: 'textarea',
          placeholder: 'To-be: components, data flows, and key choices.'
        }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      base: 'body',
      fields: [
        {
          key: 'integrations',
          label: 'Integrations',
          type: 'repeatable',
          addLabel: 'Add integration',
          createItem: () => ({
            id: crypto.randomUUID(),
            name: '',
            protocol: '',
            description: ''
          }),
          itemFields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'protocol', label: 'Protocol / pattern', type: 'text', placeholder: 'HTTPS, events, files…' },
            { key: 'description', label: 'Description', type: 'textarea' }
          ]
        }
      ]
    },
    {
      id: 'risks',
      title: 'Risks',
      base: 'body',
      fields: [
        {
          key: 'risks',
          label: 'Risks',
          type: 'repeatable',
          addLabel: 'Add risk',
          createItem: () => ({
            id: crypto.randomUUID(),
            description: '',
            likelihood: 'medium',
            impact: 'medium',
            mitigation: ''
          }),
          itemFields: [
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'likelihood', label: 'Likelihood', type: 'select', options: lowMedHigh },
            { key: 'impact', label: 'Impact', type: 'select', options: lowMedHigh },
            { key: 'mitigation', label: 'Mitigation', type: 'textarea' }
          ]
        }
      ]
    },
    {
      id: 'questions',
      title: 'Open questions',
      base: 'body',
      fields: [
        {
          key: 'openQuestions',
          label: 'Open questions',
          type: 'repeatable',
          addLabel: 'Add question',
          createItem: () => ({
            id: crypto.randomUUID(),
            question: '',
            owner: ''
          }),
          itemFields: [
            { key: 'question', label: 'Question', type: 'textarea' },
            { key: 'owner', label: 'Owner', type: 'text' }
          ]
        }
      ]
    }
  ]
}

export const adrTemplate: TemplateDefinition = {
  type: 'adr',
  title: 'Architecture Decision Record',
  description: 'Capture a single architecture decision with context and consequences.',
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      base: 'meta',
      fields: overviewFields
    },
    {
      id: 'context',
      title: 'Context',
      base: 'body',
      fields: [
        {
          key: 'context',
          label: 'Context',
          type: 'textarea',
          placeholder: 'Forces, constraints, and why a decision is needed now.'
        }
      ]
    },
    {
      id: 'decision',
      title: 'Decision',
      base: 'body',
      fields: [
        {
          key: 'decision',
          label: 'Decision',
          type: 'textarea',
          placeholder: 'What we will do, in enough detail to implement.'
        }
      ]
    },
    {
      id: 'consequences',
      title: 'Consequences',
      base: 'body',
      fields: [
        {
          key: 'consequences',
          label: 'Consequences',
          type: 'textarea',
          placeholder: 'Trade-offs, follow-up work, and what becomes easier or harder.'
        }
      ]
    },
    {
      id: 'alternatives',
      title: 'Alternatives',
      base: 'body',
      fields: [
        {
          key: 'alternatives',
          label: 'Alternatives considered',
          type: 'repeatable',
          addLabel: 'Add alternative',
          createItem: () => ({
            id: crypto.randomUUID(),
            option: '',
            rationale: ''
          }),
          itemFields: [
            { key: 'option', label: 'Option', type: 'text' },
            { key: 'rationale', label: 'Why not / why considered', type: 'textarea' }
          ]
        }
      ]
    }
  ]
}

export const visioTemplate: TemplateDefinition = {
  type: 'visio',
  title: 'Visio drawing',
  description: 'Upload a Visio file to store, preview, and group with your architecture documents.',
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Identity and lifecycle for this drawing.',
      base: 'meta',
      fields: overviewFields
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Caption the diagram and capture what viewers should look for.',
      base: 'body',
      fields: [
        {
          key: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'What this drawing shows, and how it relates to the solution.'
        }
      ]
    }
  ]
}

export const templates: Record<DocumentType, TemplateDefinition> = {
  'solution-architecture': sadTemplate,
  adr: adrTemplate,
  visio: visioTemplate
}

export function getTemplate(type: DocumentType): TemplateDefinition {
  return templates[type]
}

export function templateForDocument(document: StoredDocument): TemplateDefinition {
  return getTemplate(document.meta.type)
}
