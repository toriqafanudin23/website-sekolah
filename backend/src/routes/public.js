import { Router } from 'express'
import { asyncHandler, HttpError, must } from '../lib/http.js'
import { todayInJakarta } from '../lib/pure.js'
import { resolveUrl } from '../lib/urls.js'
import { publicCache } from '../middleware/security.js'
import { db } from '../supabase.js'

export const publicRouter = Router()
publicRouter.use('/public', publicCache)

const CATEGORIES = ['Pengumuman', 'Kegiatan', 'Prestasi']
const date = (value) => (value ? String(value).slice(0, 10) : '')
const clock = (value) => (value ? String(value).slice(0, 5) : '')

const newsItem = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  category: row.category,
  date: date(row.published_on),
  coverUrl: resolveUrl('media', row.cover_path),
})

function paging(query) {
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 50)
  const offset = Math.max(Number.parseInt(query.offset, 10) || 0, 0)
  return { limit, offset }
}

publicRouter.get(
  '/public/news',
  asyncHandler(async (req, res) => {
    const { limit, offset } = paging(req.query)
    let query = db()
      .from('news')
      .select('id, slug, title, category, published_on, cover_path')
      .eq('status', 'terbit')
      .lte('published_on', todayInJakarta())
      .order('published_on', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (CATEGORIES.includes(req.query.category)) query = query.eq('category', req.query.category)
    res.json(must(await query).map(newsItem))
  }),
)

publicRouter.get(
  '/public/news/:slug',
  asyncHandler(async (req, res) => {
    const row = must(
      await db()
        .from('news')
        .select('id, slug, title, category, body, published_on, cover_path')
        .eq('slug', req.params.slug)
        .eq('status', 'terbit')
        .lte('published_on', todayInJakarta())
        .maybeSingle(),
    )
    if (!row) throw new HttpError(404, 'Berita tidak ditemukan.')
    res.json({ ...newsItem(row), body: row.body })
  }),
)

publicRouter.get(
  '/public/announcements',
  asyncHandler(async (_req, res) => {
    const rows = must(
      await db()
        .from('announcements')
        .select('id, title, body, published_on')
        .eq('status', 'terbit')
        .lte('published_on', todayInJakarta())
        .order('published_on', { ascending: false })
        .limit(20),
    )
    res.json(rows.map((row) => ({ id: row.id, title: row.title, body: row.body, date: date(row.published_on) })))
  }),
)

publicRouter.get(
  '/public/agenda',
  asyncHandler(async (_req, res) => {
    const rows = must(
      await db().from('agenda').select('id, title, event_date, location').gte('event_date', todayInJakarta()).order('event_date').limit(20),
    )
    res.json(rows.map((row) => ({ id: row.id, title: row.title, date: date(row.event_date), location: row.location ?? '' })))
  }),
)

publicRouter.get(
  '/public/gallery',
  asyncHandler(async (_req, res) => {
    const rows = must(
      await db()
        .from('gallery_items')
        .select('id, caption, image_path')
        .order('sort_order')
        .order('created_at', { ascending: false })
        .limit(200),
    )
    res.json(rows.map((row) => ({ id: row.id, caption: row.caption, imageUrl: resolveUrl('media', row.image_path) })))
  }),
)

publicRouter.get(
  '/public/staff',
  asyncHandler(async (_req, res) => {
    const rows = must(await db().from('staff').select('id, name, role_title, category, photo_path').order('sort_order').order('name'))
    res.json(
      rows.map((row) => ({ id: row.id, name: row.name, role: row.role_title, category: row.category, imageUrl: resolveUrl('media', row.photo_path) })),
    )
  }),
)

publicRouter.get(
  '/public/downloads',
  asyncHandler(async (_req, res) => {
    const rows = must(
      await db().from('downloads').select('id, name, file_path').eq('is_published', true).order('sort_order').order('created_at', { ascending: false }),
    )
    res.json(rows.map((row) => ({ id: row.id, name: row.name, href: resolveUrl('downloads', row.file_path) })))
  }),
)

publicRouter.get(
  '/public/academic',
  asyncHandler(async (_req, res) => {
    const [activities, calendar] = await Promise.all([
      db().from('extracurriculars').select('id, name, schedule_text, description').order('name'),
      db().from('academic_calendar').select('id, label, starts_on, ends_on, semester').order('starts_on'),
    ])
    res.json({
      extracurriculars: must(activities).map((row) => ({ id: row.id, name: row.name, schedule: row.schedule_text, description: row.description })),
      calendar: must(calendar).map((row) => ({
        id: row.id,
        label: row.label,
        startsOn: date(row.starts_on),
        endsOn: date(row.ends_on),
        semester: row.semester ?? '',
      })),
    })
  }),
)

publicRouter.get(
  '/public/schedules',
  asyncHandler(async (_req, res) => {
    const rows = must(
      await db()
        .from('class_schedules')
        .select('id, grade, weekday, start_time, end_time, subject, staff(name)')
        .order('grade')
        .order('weekday')
        .order('start_time'),
    )
    res.json(
      rows.map((row) => ({
        id: row.id,
        grade: row.grade,
        weekday: row.weekday,
        startTime: clock(row.start_time),
        endTime: clock(row.end_time),
        subject: row.subject,
        teacher: row.staff?.name ?? '',
      })),
    )
  }),
)

publicRouter.get(
  '/public/settings',
  asyncHandler(async (_req, res) => {
    const rows = must(await db().from('site_settings').select('key, value'))
    res.json(Object.fromEntries(rows.map((row) => [row.key, String(row.value ?? '')])))
  }),
)
