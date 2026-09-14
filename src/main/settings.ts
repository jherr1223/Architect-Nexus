import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { z } from 'zod'

const settingsSchema = z
  .object({
    workspacePath: z.string().min(1).optional()
  })
  .strict()

export type AppSettings = z.infer<typeof settingsSchema>

function settingsFile(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

// @mitigates SolutionArch:Settings against malformed settings JSON with Zod parsing
export function loadSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(settingsFile(), 'utf8')
    return settingsSchema.parse(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function saveSettings(settings: AppSettings): void {
  const validated = settingsSchema.parse(settings)
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(settingsFile(), `${JSON.stringify(validated, null, 2)}\n`, 'utf8')
}
