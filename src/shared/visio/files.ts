export const VISIO_MAX_BYTES = 50 * 1024 * 1024
export const VISIO_THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024

export const visioExtensions = ['vsdx', 'vstx', 'vssx', 'vsd'] as const
export type VisioExtension = (typeof visioExtensions)[number]

const MACRO_EXTENSIONS = new Set(['vsdm', 'vstm', 'vssm'])

const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const OLE_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

export function visioExtensionFromFileName(fileName: string): VisioExtension {
  const base = fileName.split(/[/\\]/).pop() ?? ''
  const ext = base.includes('.') ? base.slice(base.lastIndexOf('.') + 1).toLowerCase() : ''
  if (MACRO_EXTENSIONS.has(ext)) {
    throw new Error('Macro-enabled Visio files are not allowed')
  }
  if (!visioExtensions.includes(ext as VisioExtension)) {
    throw new Error('Choose a Visio file (.vsdx, .vstx, .vssx, or .vsd)')
  }
  return ext as VisioExtension
}

export function safeOriginalFileName(filePath: string): string {
  const base = filePath.split(/[/\\]/).pop()?.trim() ?? ''
  const cleaned = base.replace(/[\u0000-\u001f<>:"|?*]/g, '').slice(0, 200)
  if (!cleaned || cleaned === '.' || cleaned === '..') {
    throw new Error('The Visio file name is not valid')
  }
  return cleaned
}

export function titleFromVisioFileName(fileName: string): string {
  const original = safeOriginalFileName(fileName)
  const dot = original.lastIndexOf('.')
  const stem = dot > 0 ? original.slice(0, dot) : original
  return stem.slice(0, 200) || 'Visio drawing'
}

export function visioAttachmentName(id: string, extension: VisioExtension): string {
  return `${id}.${extension}`
}

export function looksLikeZip(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).equals(ZIP_MAGIC)
}

export function looksLikeOle(buffer: Buffer): boolean {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(OLE_MAGIC)
}

// @mitigates SolutionArch:Visio against untrusted uploads with extension allowlist and magic-byte checks
export function assertVisioBuffer(buffer: Buffer, extension: VisioExtension): void {
  if (buffer.length === 0) {
    throw new Error('The Visio file is empty')
  }
  if (buffer.length > VISIO_MAX_BYTES) {
    throw new Error('Visio files must be 50 MB or smaller')
  }
  if (extension === 'vsd') {
    if (!looksLikeOle(buffer)) {
      throw new Error('That file is not a valid Visio drawing')
    }
    return
  }
  if (!looksLikeZip(buffer)) {
    throw new Error('That file is not a valid Visio drawing')
  }
}
