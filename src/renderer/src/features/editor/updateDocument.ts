import type { StoredDocument } from '@shared/schemas/document'

export function setMetaField(
  document: StoredDocument,
  key: string,
  value: unknown
): StoredDocument {
  return {
    ...document,
    meta: {
      ...document.meta,
      [key]: value
    }
  } as StoredDocument
}

export function setBodyField(
  document: StoredDocument,
  key: string,
  value: unknown
): StoredDocument {
  return {
    ...document,
    body: {
      ...document.body,
      [key]: value
    }
  } as StoredDocument
}

export function setRepeatableItemField(
  document: StoredDocument,
  listKey: string,
  index: number,
  fieldKey: string,
  value: unknown
): StoredDocument {
  const list = [...((document.body as Record<string, unknown>)[listKey] as Array<Record<string, unknown>>)]
  list[index] = { ...list[index], [fieldKey]: value }
  return setBodyField(document, listKey, list)
}
