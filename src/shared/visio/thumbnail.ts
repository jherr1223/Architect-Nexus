import JSZip from 'jszip'
import {
  VISIO_THUMBNAIL_MAX_BYTES,
  looksLikeZip,
  type VisioExtension
} from './files'

export interface VisioThumbnail {
  mime: 'image/png' | 'image/jpeg'
  bytes: Buffer
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])

const NAMED_THUMBNAILS = [
  'docProps/thumbnail.png',
  'docProps/thumbnail.jpeg',
  'docProps/thumbnail.jpg'
]

function detectImage(buffer: Buffer): VisioThumbnail['mime'] | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(PNG_MAGIC)) {
    return 'image/png'
  }
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(JPEG_MAGIC)) {
    return 'image/jpeg'
  }
  return null
}

function isSafeZipPath(name: string): boolean {
  const normalized = name.replaceAll('\\', '/').replace(/^\/+/, '')
  return (
    !normalized.includes('..') &&
    !normalized.startsWith('/') &&
    !/^[a-zA-Z]:/.test(normalized)
  )
}

// @mitigates SolutionArch:Visio against zip bombs with entry limits and allowlisted thumbnail paths
export async function extractVisioThumbnail(
  buffer: Buffer,
  extension: VisioExtension
): Promise<VisioThumbnail | null> {
  if (extension === 'vsd' || !looksLikeZip(buffer)) {
    return null
  }

  const zip = await JSZip.loadAsync(buffer)
  const names = Object.keys(zip.files)
  if (names.length > 4000) {
    throw new Error('The Visio package is too large to preview')
  }

  for (const candidate of NAMED_THUMBNAILS) {
    const entry = zip.file(candidate)
    if (!entry || entry.dir || !isSafeZipPath(candidate)) {
      continue
    }
    const bytes = Buffer.from(await entry.async('uint8array'))
    if (bytes.length === 0 || bytes.length > VISIO_THUMBNAIL_MAX_BYTES) {
      continue
    }
    const mime = detectImage(bytes)
    if (mime) {
      return { mime, bytes }
    }
  }

  return null
}
