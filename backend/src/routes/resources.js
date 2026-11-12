import { Router } from 'express'
import { logActivity } from '../lib/activity.js'
import { asyncHandler, HttpError, isUniqueViolation, must, requireJson } from '../lib/http.js'
import { randomCode, slugify } from '../lib/pure.js'
import { RESOURCES } from '../lib/registry.js'
import { itemToRow, rowToItem } from '../lib/serialize.js'
import { materialize } from '../lib/storage.js'
import { firstError } from '../lib/validate.js'
import { requireRole } from '../middleware/auth.js'
import { db } from '../supabase.js'

const MAX_LIST = 1000

const UUID_PARAM = /^[0-9a-f-]{36}$/i
function idOf(req) {
  if (!UUID_PARAM.test(req.params.id)) throw new HttpError(404, 'Data tidak ditemukan.')
  return req.params.id
}

async function writeRow(def, values, { id, user }) {
  const table = db().from(def.table)
  const payload = { ...values }
  if (!id && def.authorCol) payload[def.authorCol] = user.id
  if (def.handledByCol && id) payload[def.handledByCol] = user.id

  const run = async (extra = {}) => {
    const body = { ...payload, ...extra }
    return id ? table.update(body).eq('id', id).select().maybeSingle() : table.insert(body).select().single()
  }

  if (!def.slugFrom || id) return run()

  // Berita baru: slug dari judul; bila bentrok, tambahkan akhiran acak.
  const base = slugify(values[def.fields[def.slugFrom].col])
  const first = await run({ slug: base })
  return isUniqueViolation(first.error) ? run({ slug: `${base}-${randomCode(4).toLowerCase()}` }) : first
}

/** GET/POST /{key}, PUT/DELETE /{key}/{id} untuk semua modul di registry. */
export function resourcesRouter() {
  const router = Router()

  for (const [key, def] of Object.entries(RESOURCES)) {
    const guard = requireRole(...(def.roles ?? ['admin', 'editor']))

    router.get(
      `/${key}`,
      guard,
      asyncHandler(async (_req, res) => {
        let query = db().from(def.table).select('*').limit(MAX_LIST)
        for (const [column, ascending] of def.order) query = query.order(column, { ascending, nullsFirst: false })
        res.json(must(await query).map((row) => rowToItem(def, row)))
      }),
    )

    router.post(
      `/${key}`,
      guard,
      requireJson,
      asyncHandler(async (req, res) => {
        if (def.createDisabled) throw new HttpError(405, `${def.singular} tidak bisa ditambah dari panel.`)
        const result = await itemToRow(def, req.body, { partial: false, materialize })
        if (!result.ok) throw new HttpError(422, firstError(result.errors))

        const row = must(await writeRow(def, result.values, { user: req.user }))
        await logActivity(req.user, `${result.values.status === 'terbit' ? 'Menerbitkan' : 'Menambah'} ${def.singular}`, key, row.id)
        res.status(201).json(rowToItem(def, row))
      }),
    )

    router.put(
      `/${key}/:id`,
      guard,
      requireJson,
      asyncHandler(async (req, res) => {
        const id = idOf(req)
        const result = await itemToRow(def, req.body, { partial: true, materialize })
        if (!result.ok) throw new HttpError(422, firstError(result.errors))
        if (Object.keys(result.values).length === 0 && !def.handledByCol) throw new HttpError(422, 'Tidak ada perubahan.')

        const row = must(await writeRow(def, result.values, { id, user: req.user }))
        if (!row) throw new HttpError(404, 'Data tidak ditemukan.')
        await logActivity(req.user, `${result.values.status === 'terbit' ? 'Menerbitkan' : 'Mengubah'} ${def.singular}`, key, id)
        res.json(rowToItem(def, row))
      }),
    )

    router.delete(
      `/${key}/:id`,
      guard,
      asyncHandler(async (req, res) => {
        const id = idOf(req)
        must(await db().from(def.table).delete().eq('id', id))
        await logActivity(req.user, `Menghapus ${def.singular}`, key, id)
        res.status(204).end()
      }),
    )
  }

  return router
}
