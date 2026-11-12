import { randomUUID } from 'node:crypto'
import { db } from '../supabase.js'
import { HttpError } from './http.js'
import { EXTENSIONS, detectMime } from './pure.js'
import { toStoredPath } from './urls.js'

const KINDS = {
  image: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 2.5 * 1024 * 1024, label: 'Foto' },
  file: { mimes: ['application/pdf'], maxBytes: 2 * 1024 * 1024, label: 'Berkas' },
}

const DATA_URL = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=\s]+)$/

/**
 * Nilai kolom `image` atau `file` dari panel:
 *  - data URL baru   -> diperiksa lalu diunggah ke bucket, mengembalikan path
 *  - alamat milik kita atau path lama -> dipertahankan
 *  - kosong          -> null
 */
export async function materialize(spec, value, folder) {
  if (!value) return { path: null }
  if (!value.startsWith('data:')) return { path: toStoredPath(spec.bucket, value) }

  const kind = KINDS[spec.type]
  const match = DATA_URL.exec(value)
  if (!match) throw new HttpError(400, `${kind.label} tidak bisa dibaca.`)
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64')
  if (buffer.length > kind.maxBytes) throw new HttpError(413, `${kind.label} terlalu besar.`)
  const mime = detectMime(buffer)
  if (!mime || !kind.mimes.includes(mime) || mime !== match[1]) throw new HttpError(400, `Jenis ${kind.label.toLowerCase()} tidak didukung.`)

  const path = `${folder}/${randomUUID()}.${EXTENSIONS[mime]}`
  const { error } = await db().storage.from(spec.bucket).upload(path, buffer, { contentType: mime, cacheControl: '31536000' })
  if (error) {
    console.error('[storage]', error.message)
    throw new HttpError(500, `${kind.label} gagal diunggah.`)
  }
  return { path, size: buffer.length }
}
