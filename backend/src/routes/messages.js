import { Router } from 'express'
import { asyncHandler, HttpError, must, requireJson } from '../lib/http.js'
import { isEmail, normalizePhone } from '../lib/pure.js'
import { firstError, validate } from '../lib/validate.js'
import { limiter } from '../middleware/security.js'
import { db } from '../supabase.js'

export const messagesRouter = Router()

const FIELDS = {
  name: { type: 'text', required: true, max: 100, label: 'Nama' },
  reply: { type: 'text', required: true, max: 150, label: 'Email atau nomor WhatsApp' },
  message: { type: 'text', required: true, max: 2000, label: 'Pesan' },
}

/** Pesan dari formulir Kontak (publik, dibatasi laju). Pesan dibaca admin lewat GET /messages (modul generik). */
messagesRouter.post(
  '/messages',
  limiter(60, 5),
  requireJson,
  asyncHandler(async (req, res) => {
    const { value, errors, ok } = validate(FIELDS, req.body)
    if (!ok) throw new HttpError(422, firstError(errors))
    const phone = normalizePhone(value.reply)
    if (!isEmail(value.reply) && !phone) throw new HttpError(422, 'Isi email atau nomor WhatsApp yang benar.')

    must(await db().from('contact_messages').insert({ name: value.name, reply_contact: phone ?? value.reply, message: value.message }))
    res.status(201).json({ ok: true })
  }),
)
