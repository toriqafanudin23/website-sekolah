import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

/** Tanpa 0/O, 1/I/L agar nomor mudah dibaca dan dibacakan lewat telepon. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function slugify(text) {
  const slug = String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
  return slug || 'berita'
}

export function randomCode(length) {
  let code = ''
  for (let i = 0; i < length; i += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return code
}

/** `2027/2028` -> `PPDB27-7K3Q9X`. Acak, tidak berurutan, supaya tidak mudah ditebak. */
export function registrationNumber(schoolYear) {
  const year = /^(\d{4})/.exec(schoolYear)?.[1]?.slice(2) ?? '00'
  return `PPDB${year}-${randomCode(6)}`
}

export const newToken = () => randomBytes(24).toString('base64url')
export const sha256 = (text) => createHash('sha256').update(text).digest('hex')

export function safeEqual(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Jenis berkas dari byte awal (bukan dari nama atau header yang bisa dipalsukan). */
export function detectMime(buffer) {
  if (!buffer || buffer.length < 12) return null
  if (buffer.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  return null
}

export const EXTENSIONS = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** 08.., 628.., +628.. (spasi dan strip diabaikan) -> `08...`; `null` bila bukan nomor ponsel Indonesia. */
export function normalizePhone(value) {
  const digits = String(value).replace(/[\s-]/g, '')
  if (!/^(\+62|62|0)8\d{7,12}$/.test(digits)) return null
  return `0${digits.replace(/^(\+62|62|0)/, '')}`
}

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim())

/** Tanggal hari ini `YYYY-MM-DD` di zona waktu sekolah (WIB). */
export const todayInJakarta = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

export function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** Lolos-kan karakter khusus LIKE/ILIKE agar masukan pengguna dicocokkan apa adanya. */
export const escapeLike = (text) => String(text).replace(/[\\%_]/g, (char) => `\\${char}`)
