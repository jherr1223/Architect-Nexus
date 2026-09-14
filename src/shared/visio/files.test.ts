import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import {
  assertVisioBuffer,
  titleFromVisioFileName,
  visioExtensionFromFileName
} from './files'
import { extractVisioThumbnail } from './thumbnail'

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

describe('Visio file validation', () => {
  it('accepts allowed extensions and rejects macro-enabled files', () => {
    expect(visioExtensionFromFileName('C:\\drawings\\Network.VSDX')).toBe('vsdx')
    expect(() => visioExtensionFromFileName('macros.vsdm')).toThrow(/Macro-enabled/)
    expect(() => visioExtensionFromFileName('notes.docx')).toThrow(/Choose a Visio file/)
  })

  it('derives a title from the file name', () => {
    expect(titleFromVisioFileName('Target architecture.vsdx')).toBe('Target architecture')
  })

  it('rejects a vsdx that is not a zip', () => {
    expect(() => assertVisioBuffer(Buffer.from('not-a-drawing'), 'vsdx')).toThrow(/not a valid Visio/)
  })
})

describe('Visio thumbnail extraction', () => {
  it('reads an embedded PNG thumbnail from a vsdx package', async () => {
    const zip = new JSZip()
    zip.file('docProps/thumbnail.png', PNG_1X1)
    const packed = Buffer.from(await zip.generateAsync({ type: 'uint8array' }))
    const thumbnail = await extractVisioThumbnail(packed, 'vsdx')
    expect(thumbnail?.mime).toBe('image/png')
    expect(thumbnail?.bytes.subarray(0, 4).equals(PNG_1X1.subarray(0, 4))).toBe(true)
  })

  it('ignores path-escape zip entries', async () => {
    const zip = new JSZip()
    zip.file('../thumbnail.png', PNG_1X1)
    const packed = Buffer.from(await zip.generateAsync({ type: 'uint8array' }))
    const thumbnail = await extractVisioThumbnail(packed, 'vsdx')
    expect(thumbnail).toBeNull()
  })
})
