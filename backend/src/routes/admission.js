import express, { Router } from 'express'
import { logActivity } from '../lib/activity.js'
import { asyncHandler, HttpError, isUniqueViolation, must, requireJson } from '../lib/http.js'
import { detectMime, escapeLike, newToken, normalizePhone, registrationNumber, safeEqual, sha256, todayInJakarta } from '../lib/pure.js'
import { firstError, validate } from '../lib/validate.js'
import { requireRole } from '../middleware/auth.js'
import { limiter } from '../middleware/security.js'
import { db } from '../supabase.js'
import { config } from '../config.js'
import { currentPeriod } from './dashboard.js'

export const admissionRouter = Router()

const BUCKET = 'admission'
const MAX_FILE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png']
const SIGNED_URL_SECONDS = 300

/** Urutan tampil dan label berkas; `required` perlu dikonfirmasi panitia (lihat PRD, pertanyaan terbuka). */
const DOCUMENTS = [
  { id: 'birthCertificate', label: 'Akta kelahiran', required: true },
  { id: 'familyCard', label: 'Kartu Keluarga', required: true },
  { id: 'photo', label: 'Pas foto', required: true },
  { id: 'supporting', label: 'Berkas pendukung', required: false },
  { id: 'kindergarten', label: 'Surat keterangan TK', required: false },
]
const DOC_IDS = DOCUMENTS.map((doc) => doc.id)
const labelOfDoc = (id) => DOCUMENTS.find((doc) => doc.id === id)?.label ?? id

const STATUS_LABELS = {
  baru: 'Menunggu verifikasi',
  terverifikasi: 'Berkas terverifikasi',
  diterima: 'Diterima',
  ditolak: 'Ditolak',
}
const STATUSES = Object.keys(STATUS_LABELS)

const FIELDS = {
  track: { type: 'enum', values: ['domisili', 'afirmasi', 'perpindahan'], required: true, label: 'Jalur pendaftaran' },
  fullName: { type: 'text', required: true, max: 120, label: 'Nama lengkap' },
  birthDate: { type: 'date', required: true, label: 'Tanggal lahir' },
  address: { type: 'text', required: true, max: 300, label: 'Alamat lengkap' },
  village: { type: 'text', required: true, max: 100, label: 'Desa atau kelurahan' },
  guardianName: { type: 'text', required: true, max: 120, label: 'Nama orang tua atau wali' },
  guardianPhone: { type: 'text', required: true, max: 20, label: 'Nomor WhatsApp' },
}

const itemOf = (row) => ({
  id: row.id,
  registrationNumber: row.registration_number,
  track: row.track,
  fullName: row.full_name,
  birthDate: String(row.birth_date).slice(0, 10),
  address: row.address,
  village: row.village,
  guardianName: row.guardian_name,
  guardianPhone: row.guardian_phone,
  status: row.status,
  statusNote: row.status_note ?? '',
})

/** Cari pendaftaran dan cocokkan token unggah (perbandingan waktu-konstan). */
async function registrationForUpload(req) {
  const token = req.get('x-upload-token') ?? ''
  const row = must(
    await db()
      .from('registrations')
      .select('id, status, upload_token_hash')
      .eq('registration_number', String(req.params.number).toUpperCase())
      .maybeSingle(),
  )
  // Pesan sama untuk nomor salah dan token salah agar nomor tidak bisa diuji.
  if (!row || !token || !safeEqual(sha256(token), row.upload_token_hash)) throw new HttpError(403, 'Kunci unggah tidak sah.')
  if (row.status !== 'baru') throw new HttpError(409, 'Pendaftaran ini sudah diproses; berkas tidak bisa diubah.')
  return row
}

// ---------- Publik ----------

admissionRouter.post(
  '/registrations',
  limiter(60, 5),
  requireJson,
  asyncHandler(async (req, res) => {
    const body = req.body ?? {}
    const { value, errors, ok } = validate(FIELDS, body)
    if (!ok) throw new HttpError(422, firstError(errors))

    const phone = normalizePhone(value.guardianPhone)
    if (!phone) throw new HttpError(422, 'Nomor WhatsApp belum sesuai format. Contoh: 081234567890.')
    if (value.birthDate > todayInJakarta() || value.birthDate < '2000-01-01') throw new HttpError(422, 'Tanggal lahir tidak masuk akal.')
    if (body.consent !== true) throw new HttpError(422, 'Persetujuan orang tua atau wali wajib dicentang.')

    const files = Array.isArray(body.files) ? body.files : []
    const declared = new Map()
    for (const file of files) {
      const valid = DOC_IDS.includes(file?.docType) && ALLOWED_MIMES.includes(file?.mimeType) && Number.isInteger(file?.size) && file.size > 0 && file.size <= MAX_FILE_BYTES
      if (!valid) throw new HttpError(422, 'Berkas harus PDF, JPG, atau PNG dengan ukuran maksimal 2 MB.')
      declared.set(file.docType, file.mimeType)
    }
    const missing = DOCUMENTS.filter((doc) => doc.required && !declared.has(doc.id)).map((doc) => doc.label)
    if (missing.length > 0) throw new HttpError(422, `Berkas wajib belum lengkap: ${missing.join(', ')}.`)

    const period = await currentPeriod()
    if (!period?.is_open) throw new HttpError(403, 'Pendaftaran belum dibuka.')
    const today = todayInJakarta()
    if (config.enforceAdmissionDates && (today < period.starts_on || today > period.ends_on)) {
      throw new HttpError(403, 'Pendaftaran di luar periode yang ditetapkan.')
    }

    const duplicateCount = (
      await db()
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('period_id', period.id)
        .eq('birth_date', value.birthDate)
        .eq('guardian_phone', phone)
        .ilike('full_name', escapeLike(value.fullName))
    ).count

    const uploadToken = newToken()
    let created
    for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
      const result = await db()
        .from('registrations')
        .insert({
          registration_number: registrationNumber(period.school_year),
          period_id: period.id,
          track: value.track,
          full_name: value.fullName,
          birth_date: value.birthDate,
          address: value.address,
          village: value.village,
          guardian_name: value.guardianName,
          guardian_phone: phone,
          possible_duplicate: (duplicateCount ?? 0) > 0,
          consent_at: new Date().toISOString(),
          upload_token_hash: sha256(uploadToken),
        })
        .select('id, registration_number')
        .single()
      if (isUniqueViolation(result.error)) continue // nomor acak bentrok: ulangi dengan nomor baru
      created = must(result)
    }
    if (!created) throw new HttpError(500, 'Nomor pendaftaran gagal dibuat. Coba lagi.')

    must(
      await db()
        .from('registration_documents')
        .insert([...declared].map(([docType, mimeType]) => ({
          registration_id: created.id,
          doc_type: docType,
          mime_type: mimeType,
          storage_path: `registrations/${created.id}/${docType}`,
        }))),
    )

    res.status(201).json({ registrationNumber: created.registration_number, uploadToken })
  }),
)

// Berkas mentah per permintaan (maks. 2 MB) agar muat batas 4,5 MB fungsi Vercel.
admissionRouter.put(
  '/registrations/:number/documents/:docType',
  limiter(60, 40),
  express.raw({ type: () => true, limit: MAX_FILE_BYTES }),
  asyncHandler(async (req, res) => {
    const { docType } = req.params
    if (!DOC_IDS.includes(docType)) throw new HttpError(404, 'Jenis berkas tidak dikenal.')
    const registration = await registrationForUpload(req)

    const buffer = req.body
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new HttpError(400, 'Berkas kosong.')
    const mime = detectMime(buffer)
    if (!mime || !ALLOWED_MIMES.includes(mime)) throw new HttpError(400, 'Berkas harus PDF, JPG, atau PNG.')

    const doc = must(
      await db()
        .from('registration_documents')
        .select('id, storage_path, mime_type')
        .eq('registration_id', registration.id)
        .eq('doc_type', docType)
        .maybeSingle(),
    )
    if (!doc) throw new HttpError(404, 'Berkas ini tidak tercantum pada pendaftaran.')
    if (doc.mime_type !== mime) throw new HttpError(400, 'Jenis berkas tidak sesuai dengan yang didaftarkan.')

    const { error } = await db().storage.from(BUCKET).upload(doc.storage_path, buffer, { contentType: mime, upsert: true })
    if (error) {
      console.error('[storage]', error.message)
      throw new HttpError(500, 'Berkas gagal diunggah. Coba lagi.')
    }
    must(
      await db()
        .from('registration_documents')
        .update({ uploaded: true, uploaded_at: new Date().toISOString(), size_bytes: buffer.length, verified: false })
        .eq('id', doc.id),
    )
    res.status(204).end()
  }),
)

admissionRouter.post(
  '/registrations/:number/complete',
  limiter(60, 40),
  asyncHandler(async (req, res) => {
    const registration = await registrationForUpload(req)
    const docs = must(await db().from('registration_documents').select('doc_type, uploaded').eq('registration_id', registration.id))
    res.json({ missing: docs.filter((doc) => !doc.uploaded).map((doc) => doc.doc_type) })
  }),
)

admissionRouter.get(
  '/registrations/:number',
  limiter(15, 30),
  asyncHandler(async (req, res) => {
    const row = must(
      await db()
        .from('registrations')
        .select('status, status_note')
        .eq('registration_number', String(req.params.number).trim().toUpperCase())
        .maybeSingle(),
    )
    if (!row) throw new HttpError(404, 'Nomor tidak ditemukan.')
    res.set('Cache-Control', 'no-store')
    res.json({ status: STATUS_LABELS[row.status], ...(row.status_note ? { note: row.status_note } : {}) })
  }),
)

// ---------- Admin (hanya peran admin) ----------

const adminOnly = requireRole('admin')

admissionRouter.get(
  '/admission',
  adminOnly,
  asyncHandler(async (_req, res) => {
    const rows = must(await db().from('registrations').select('*').order('created_at', { ascending: false }).limit(1000))
    res.json(rows.map(itemOf))
  }),
)

const UUID = /^[0-9a-f-]{36}$/i

admissionRouter.get(
  '/admission/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    if (!UUID.test(req.params.id)) throw new HttpError(404, 'Pendaftar tidak ditemukan.')
    const row = must(await db().from('registrations').select('*').eq('id', req.params.id).maybeSingle())
    if (!row) throw new HttpError(404, 'Pendaftar tidak ditemukan.')

    const docs = must(await db().from('registration_documents').select('*').eq('registration_id', row.id))
    const documents = await Promise.all(
      DOC_IDS.map((id) => docs.find((doc) => doc.doc_type === id))
        .filter(Boolean)
        .map(async (doc) => {
          let url
          if (doc.uploaded) {
            const signed = await db().storage.from(BUCKET).createSignedUrl(doc.storage_path, SIGNED_URL_SECONDS)
            url = signed.data?.signedUrl
          }
          return { docType: doc.doc_type, label: labelOfDoc(doc.doc_type), uploaded: doc.uploaded, verified: doc.verified, ...(url ? { url } : {}) }
        }),
    )
    res.set('Cache-Control', 'no-store')
    res.json({ item: itemOf(row), documents, possibleDuplicate: row.possible_duplicate })
  }),
)

admissionRouter.put(
  '/admission/:id',
  adminOnly,
  requireJson,
  asyncHandler(async (req, res) => {
    if (!UUID.test(req.params.id)) throw new HttpError(404, 'Pendaftar tidak ditemukan.')
    const { value, errors, ok } = validate(
      {
        status: { type: 'enum', values: STATUSES, required: true, label: 'Status' },
        statusNote: { type: 'text', max: 500, label: 'Catatan' },
      },
      req.body,
    )
    if (!ok) throw new HttpError(422, firstError(errors))

    const decided = value.status === 'diterima' || value.status === 'ditolak'
    const row = must(
      await db()
        .from('registrations')
        .update({
          status: value.status,
          status_note: value.statusNote || null,
          decided_by: decided ? req.user.id : null,
          decided_at: decided ? new Date().toISOString() : null,
        })
        .eq('id', req.params.id)
        .select('id')
        .maybeSingle(),
    )
    if (!row) throw new HttpError(404, 'Pendaftar tidak ditemukan.')
    await logActivity(req.user, `Mengubah status pendaftar menjadi ${STATUS_LABELS[value.status].toLowerCase()}`, 'registrations', row.id)
    res.status(204).end()
  }),
)

admissionRouter.patch(
  '/admission/:id/documents/:docType',
  adminOnly,
  requireJson,
  asyncHandler(async (req, res) => {
    if (!UUID.test(req.params.id) || !DOC_IDS.includes(req.params.docType)) throw new HttpError(404, 'Berkas tidak ditemukan.')
    if (typeof req.body?.verified !== 'boolean') throw new HttpError(422, 'Nilai verified harus true atau false.')
    const row = must(
      await db()
        .from('registration_documents')
        .update({ verified: req.body.verified })
        .eq('registration_id', req.params.id)
        .eq('doc_type', req.params.docType)
        .eq('uploaded', true)
        .select('id')
        .maybeSingle(),
    )
    if (!row) throw new HttpError(404, 'Berkas tidak ditemukan.')
    res.status(204).end()
  }),
)
