export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

/** Express 4 tidak menangkap galat async; bungkus setiap handler async dengan ini. */
export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

/**
 * Pelanggaran aturan data yang disebabkan isian admin (bukan kerusakan server) dijawab 4xx dengan pesan Indonesia,
 * supaya panel menampilkannya apa adanya. Kode Postgres: 23505 unik, 23503 kunci asing, 23514 aturan check.
 */
const CONSTRAINT_ERRORS = {
  '23505': [409, 'Data yang sama sudah ada. Ubah isiannya lalu coba lagi.'],
  '23503': [422, 'Data terkait tidak ditemukan. Muat ulang halaman lalu coba lagi.'],
  '23514': [422, 'Isian tidak memenuhi aturan, misalnya jam selesai harus setelah jam mulai.'],
}

/** Lemparkan galat Supabase (kode asli hanya di log server, pesan ke klien generik). */
export function must(result, message = 'Terjadi kesalahan pada server.') {
  if (result.error) {
    console.error('[supabase]', result.error.code, result.error.message)
    const [status, text] = CONSTRAINT_ERRORS[result.error.code] ?? [500, message]
    const error = new HttpError(status, text)
    error.cause = result.error
    throw error
  }
  return result.data
}

export const isUniqueViolation = (error) => error?.code === '23505'

/** Hanya terima badan JSON (pelindung CSRF tambahan: form lintas situs tidak bisa mengirim JSON). */
export function requireJson(req, _res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return next(new HttpError(415, 'Permintaan harus berformat JSON.'))
  }
  next()
}
