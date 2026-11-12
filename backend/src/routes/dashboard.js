import { Router } from 'express'
import { logActivity } from '../lib/activity.js'
import { asyncHandler, HttpError, must, requireJson } from '../lib/http.js'
import { todayInJakarta } from '../lib/pure.js'
import { requireRole } from '../middleware/auth.js'
import { db } from '../supabase.js'

export const dashboardRouter = Router()

const count = async (query) => {
  const { count: total, error } = await query
  must({ error })
  return total ?? 0
}
const head = (table) => db().from(table).select('id', { count: 'exact', head: true })

/** Periode PPDB terbaru = periode yang dipakai. */
export async function currentPeriod() {
  return must(await db().from('admission_periods').select('*').order('starts_on', { ascending: false }).limit(1).maybeSingle())
}

dashboardRouter.get(
  '/dashboard',
  ...requireRole('admin', 'editor'),
  asyncHandler(async (_req, res) => {
    const today = todayInJakarta()
    const [pending, published, upcoming, messages, drafts, undated, period, activity] = await Promise.all([
      count(head('registrations').eq('status', 'baru')),
      count(head('news').eq('status', 'terbit')),
      count(head('agenda').gte('event_date', today)),
      count(head('contact_messages').eq('status', 'baru')),
      count(head('news').eq('status', 'draf')),
      count(head('agenda').is('event_date', null)),
      currentPeriod(),
      db().from('activity_logs').select('action, admin:admin_profiles(name)').order('created_at', { ascending: false }).limit(5),
    ])

    res.json({
      pendingRegistrations: pending,
      publishedNews: published,
      upcomingAgenda: upcoming,
      newMessages: messages,
      followUps: { pendingFiles: pending, draftNews: drafts, undatedAgenda: undated },
      admission: { open: Boolean(period?.is_open) },
      activity: must(activity).map((row) => ({ admin: row.admin?.name ?? 'Admin', action: row.action })),
    })
  }),
)

dashboardRouter.patch(
  '/admission',
  ...requireRole('admin'),
  requireJson,
  asyncHandler(async (req, res) => {
    if (typeof req.body?.open !== 'boolean') throw new HttpError(422, 'Nilai open harus true atau false.')
    const period = await currentPeriod()
    if (!period) throw new HttpError(404, 'Periode PPDB belum dibuat.')
    must(await db().from('admission_periods').update({ is_open: req.body.open }).eq('id', period.id))
    await logActivity(req.user, req.body.open ? 'Membuka pendaftaran PPDB' : 'Menutup pendaftaran PPDB', 'admission_periods', period.id)
    res.status(204).end()
  }),
)
