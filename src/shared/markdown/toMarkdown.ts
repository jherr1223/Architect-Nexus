import { documentTypeLabel } from '@shared/templates/createDocument'
import { isAdrDocument, isSadDocument, isVisioDocument, type StoredDocument } from '@shared/schemas/document'

function heading(text: string, level: number): string {
  return `${'#'.repeat(level)} ${text}`
}

function asMarkdownBlock(value: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : '_Not captured yet._'
}

function bullets(
  items: Array<Record<string, unknown>>,
  render: (item: Record<string, unknown>, index: number) => string
): string {
  if (items.length === 0) {
    return '_None listed._'
  }
  return items.map((item, index) => render(item, index)).join('\n\n')
}

export function documentToMarkdown(document: StoredDocument): string {
  const { meta } = document
  const lines: string[] = [
    heading(meta.title, 1),
    '',
    `- **Type:** ${documentTypeLabel(meta.type)}`,
    `- **Status:** ${meta.status}`,
    `- **Version:** ${meta.version}`,
    `- **Business:** ${meta.business.trim() || '—'}`,
    `- **System:** ${meta.system.trim() || '—'}`,
    `- **Author:** ${meta.author.trim() || '—'}`,
    `- **Tags:** ${meta.tags.length > 0 ? meta.tags.join(', ') : '—'}`,
    `- **Updated:** ${meta.updatedAt}`,
    ''
  ]

  if (isSadDocument(document)) {
    const body = document.body
    lines.push(
      heading('Context', 2),
      '',
      asMarkdownBlock(body.context),
      '',
      heading('Goals', 2),
      '',
      asMarkdownBlock(body.goals),
      '',
      heading('Non-goals', 2),
      '',
      asMarkdownBlock(body.nonGoals),
      '',
      heading('Stakeholders', 2),
      '',
      bullets(body.stakeholders, (item) => {
        const name = String(item.name || 'Unnamed')
        const role = String(item.role || 'Role not set')
        const interest = String(item.interest || '')
        return `### ${name}\n\n- **Role:** ${role}${interest ? `\n- **Interest:** ${interest}` : ''}`
      }),
      '',
      heading('Functional requirements', 2),
      '',
      bullets(body.functionalRequirements, (item) => {
        const title = String(item.title || 'Untitled requirement')
        const priority = String(item.priority || '')
        const description = String(item.description || '')
        return `### ${title}\n\n- **Priority:** ${priority}\n\n${asMarkdownBlock(description)}`
      }),
      '',
      heading('Non-functional requirements', 2),
      '',
      bullets(body.nonFunctionalRequirements, (item) => {
        const category = String(item.category || 'General')
        const metric = String(item.metric || '—')
        const statement = String(item.statement || '')
        return `### ${category}\n\n- **Metric:** ${metric}\n\n${asMarkdownBlock(statement)}`
      }),
      '',
      heading('Current architecture', 2),
      '',
      asMarkdownBlock(body.currentArchitecture),
      '',
      heading('Target architecture', 2),
      '',
      asMarkdownBlock(body.targetArchitecture),
      '',
      heading('Integrations', 2),
      '',
      bullets(body.integrations, (item) => {
        const name = String(item.name || 'Unnamed integration')
        const protocol = String(item.protocol || '—')
        const description = String(item.description || '')
        return `### ${name}\n\n- **Protocol / pattern:** ${protocol}\n\n${asMarkdownBlock(description)}`
      }),
      '',
      heading('Risks', 2),
      '',
      bullets(body.risks, (item) => {
        const description = String(item.description || 'Risk')
        const likelihood = String(item.likelihood || '')
        const impact = String(item.impact || '')
        const mitigation = String(item.mitigation || '')
        return `### Risk\n\n${asMarkdownBlock(description)}\n\n- **Likelihood:** ${likelihood}\n- **Impact:** ${impact}\n- **Mitigation:** ${mitigation.trim() || '—'}`
      }),
      '',
      heading('Open questions', 2),
      '',
      bullets(body.openQuestions, (item) => {
        const question = String(item.question || 'Question')
        const owner = String(item.owner || 'Unassigned')
        return `- ${question} — _${owner}_`
      })
    )
  } else if (isAdrDocument(document)) {
    const body = document.body
    lines.push(
      heading('Context', 2),
      '',
      asMarkdownBlock(body.context),
      '',
      heading('Decision', 2),
      '',
      asMarkdownBlock(body.decision),
      '',
      heading('Consequences', 2),
      '',
      asMarkdownBlock(body.consequences),
      '',
      heading('Alternatives', 2),
      '',
      bullets(body.alternatives, (item) => {
        const option = String(item.option || 'Untitled option')
        const rationale = String(item.rationale || '')
        return `### ${option}\n\n${asMarkdownBlock(rationale)}`
      })
    )
  } else if (isVisioDocument(document)) {
    const body = document.body
    lines.push(
      heading('Visio file', 2),
      '',
      `- **File:** ${body.originalFileName}`,
      `- **Type:** .${body.extension}`,
      '',
      heading('Notes', 2),
      '',
      asMarkdownBlock(body.notes)
    )
  }

  return `${lines.join('\n').trim()}\n`
}
