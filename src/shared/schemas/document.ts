import { z } from 'zod'

export const DOCUMENT_SCHEMA_VERSION = 1 as const

export const documentTypeSchema = z.enum(['solution-architecture', 'adr', 'visio'])
export type DocumentType = z.infer<typeof documentTypeSchema>

export const documentStatusSchema = z.enum([
  'draft',
  'in-review',
  'approved',
  'deprecated'
])
export type DocumentStatus = z.infer<typeof documentStatusSchema>

export const documentMetaSchema = z
  .object({
    id: z.string().uuid(),
    type: documentTypeSchema,
    title: z.string().min(1).max(200),
    status: documentStatusSchema,
    version: z.string().min(1).max(40),
    business: z.string().max(200).default(''),
    system: z.string().max(200),
    author: z.string().max(200),
    tags: z.array(z.string().min(1).max(40)).max(20),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()

export type DocumentMeta = z.infer<typeof documentMetaSchema>

const uuidId = z.string().uuid()

export const stakeholderSchema = z
  .object({
    id: uuidId,
    name: z.string().max(200),
    role: z.string().max(200),
    interest: z.string().max(500)
  })
  .strict()

export const requirementSchema = z
  .object({
    id: uuidId,
    title: z.string().max(200),
    description: z.string().max(4000),
    priority: z.enum(['must', 'should', 'could'])
  })
  .strict()

export const nfrSchema = z
  .object({
    id: uuidId,
    category: z.string().max(80),
    statement: z.string().max(4000),
    metric: z.string().max(200)
  })
  .strict()

export const integrationSchema = z
  .object({
    id: uuidId,
    name: z.string().max(200),
    protocol: z.string().max(80),
    description: z.string().max(4000)
  })
  .strict()

export const riskSchema = z
  .object({
    id: uuidId,
    description: z.string().max(2000),
    likelihood: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
    mitigation: z.string().max(2000)
  })
  .strict()

export const openQuestionSchema = z
  .object({
    id: uuidId,
    question: z.string().max(2000),
    owner: z.string().max(200)
  })
  .strict()

export const sadBodySchema = z
  .object({
    context: z.string().max(20000),
    goals: z.string().max(10000),
    nonGoals: z.string().max(10000),
    stakeholders: z.array(stakeholderSchema).max(50),
    functionalRequirements: z.array(requirementSchema).max(100),
    nonFunctionalRequirements: z.array(nfrSchema).max(100),
    currentArchitecture: z.string().max(20000),
    targetArchitecture: z.string().max(20000),
    integrations: z.array(integrationSchema).max(50),
    risks: z.array(riskSchema).max(50),
    openQuestions: z.array(openQuestionSchema).max(50)
  })
  .strict()

export type SadBody = z.infer<typeof sadBodySchema>

export const alternativeSchema = z
  .object({
    id: uuidId,
    option: z.string().max(200),
    rationale: z.string().max(4000)
  })
  .strict()

export const adrBodySchema = z
  .object({
    context: z.string().max(20000),
    decision: z.string().max(20000),
    consequences: z.string().max(20000),
    alternatives: z.array(alternativeSchema).max(20)
  })
  .strict()

export type AdrBody = z.infer<typeof adrBodySchema>

export const visioExtensionSchema = z.enum(['vsdx', 'vstx', 'vssx', 'vsd'])

export const visioBodySchema = z
  .object({
    originalFileName: z.string().min(1).max(200),
    extension: visioExtensionSchema,
    sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
    notes: z.string().max(20000)
  })
  .strict()

export type VisioBody = z.infer<typeof visioBodySchema>

export const sadDocumentSchema = z
  .object({
    schemaVersion: z.literal(DOCUMENT_SCHEMA_VERSION),
    meta: documentMetaSchema.extend({ type: z.literal('solution-architecture') }).strict(),
    body: sadBodySchema
  })
  .strict()

export const adrDocumentSchema = z
  .object({
    schemaVersion: z.literal(DOCUMENT_SCHEMA_VERSION),
    meta: documentMetaSchema.extend({ type: z.literal('adr') }).strict(),
    body: adrBodySchema
  })
  .strict()

export const visioDocumentSchema = z
  .object({
    schemaVersion: z.literal(DOCUMENT_SCHEMA_VERSION),
    meta: documentMetaSchema.extend({ type: z.literal('visio') }).strict(),
    body: visioBodySchema
  })
  .strict()

export const storedDocumentSchema = z.union([sadDocumentSchema, adrDocumentSchema, visioDocumentSchema])
export type StoredDocument = z.infer<typeof storedDocumentSchema>
export type SadDocument = z.infer<typeof sadDocumentSchema>
export type AdrDocument = z.infer<typeof adrDocumentSchema>
export type VisioDocument = z.infer<typeof visioDocumentSchema>

export const createDocumentInputSchema = z
  .object({
    type: z.enum(['solution-architecture', 'adr']),
    title: z.string().min(1).max(200)
  })
  .strict()

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>

export const documentIdSchema = z.string().uuid()

export function isSadDocument(document: StoredDocument): document is SadDocument {
  return document.meta.type === 'solution-architecture'
}

export function isAdrDocument(document: StoredDocument): document is AdrDocument {
  return document.meta.type === 'adr'
}

export function isVisioDocument(document: StoredDocument): document is VisioDocument {
  return document.meta.type === 'visio'
}

// @mitigates SolutionArch:Documents against untrusted JSON with strict Zod schemas
export function parseStoredDocument(data: unknown): StoredDocument {
  return storedDocumentSchema.parse(data)
}
