const env = process.env

const list = (value) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean)

const isProd = env.NODE_ENV === 'production'

export const config = {
  isProd,
  port: Number(env.PORT) || 3001,
  supabaseUrl: (env.SUPABASE_URL ?? '').replace(/\/+$/, ''),
  anonKey: env.SUPABASE_ANON_KEY ?? '',
  serviceKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  allowedOrigins: list(env.ALLOWED_ORIGINS).length > 0 ? list(env.ALLOWED_ORIGINS) : isProd ? [] : ['http://localhost:5173'],
  cookieSameSite: ['lax', 'strict', 'none'].includes(env.COOKIE_SAMESITE) ? env.COOKIE_SAMESITE : 'lax',
  enforceAdmissionDates: env.ADMISSION_ENFORCE_DATES !== 'false',
}

/** Dipanggil saat dibutuhkan (bukan saat impor) agar /health tetap hidup dan galatnya jelas. */
export function requireSupabaseConfig() {
  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'].filter((name) => !env[name])
  if (missing.length > 0) throw new Error(`Variabel lingkungan belum diisi: ${missing.join(', ')}`)
}
