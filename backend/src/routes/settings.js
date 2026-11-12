import { Router } from 'express'
import { logActivity } from '../lib/activity.js'
import { asyncHandler, HttpError, must, requireJson } from '../lib/http.js'
import { requireRole } from '../middleware/auth.js'
import { db } from '../supabase.js'

/** Kunci yang boleh disimpan, sama dengan repo web: src/features/admin/settings.ts. Panjang maks. per kunci. */
export const SETTING_KEYS = {
  'contact.address': 300,
  'contact.phone': 60,
  'contact.email': 120,
  'contact.hours': 150,
  'headmaster.name': 120,
  'headmaster.welcome': 5000,
  'school.accreditation': 60,
  'school.history': 8000,
  'school.vision': 1000,
  'school.missions': 3000,
  'stats.students': 20,
  'stats.staff': 20,
  'stats.classes': 20,
  'stats.achievements': 20,
}

export const settingsRouter = Router()
const adminOnly = requireRole('admin')

settingsRouter.get(
  '/settings',
  adminOnly,
  asyncHandler(async (_req, res) => {
    const rows = must(await db().from('site_settings').select('key, value'))
    res.json(Object.fromEntries(rows.map((row) => [row.key, String(row.value ?? '')])))
  }),
)

settingsRouter.put(
  '/settings',
  adminOnly,
  requireJson,
  asyncHandler(async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const rows = []
    for (const [key, limit] of Object.entries(SETTING_KEYS)) {
      if (!(key in body)) continue
      const value = typeof body[key] === 'string' ? body[key].trim() : ''
      if (value.length > limit) throw new HttpError(422, `Isian ${key} terlalu panjang (maksimal ${limit} karakter).`)
      rows.push({ key, value, updated_by: req.user.id, updated_at: new Date().toISOString() })
    }
    if (rows.length > 0) must(await db().from('site_settings').upsert(rows, { onConflict: 'key' }))
    await logActivity(req.user, 'Mengubah pengaturan situs', 'settings')
    res.status(204).end()
  }),
)
