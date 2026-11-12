import { config } from '../config.js'
import { HttpError, must } from '../lib/http.js'
import { authClient, db } from '../supabase.js'

const ACCESS = 'sb-access'
const REFRESH = 'sb-refresh'

const cookieBase = () => ({
  httpOnly: true,
  secure: config.isProd || config.cookieSameSite === 'none',
  sameSite: config.cookieSameSite,
  path: '/',
})

export function setSessionCookies(res, session, remember) {
  res.cookie(ACCESS, session.access_token, { ...cookieBase(), maxAge: Math.max(session.expires_in ?? 3600, 60) * 1000 })
  res.cookie(REFRESH, session.refresh_token, { ...cookieBase(), ...(remember ? { maxAge: 30 * 24 * 3600 * 1000 } : {}) })
}

export function clearSessionCookies(res) {
  res.clearCookie(ACCESS, cookieBase())
  res.clearCookie(REFRESH, cookieBase())
}

async function profileOf(userId) {
  const { data, error } = await db().from('admin_profiles').select('id, name, role, is_active').eq('id', userId).maybeSingle()
  if (error) must({ error })
  return data?.is_active ? data : null
}

/** Pengguna dari cookie akses; bila kedaluwarsa, mencoba refresh. `null` bila tidak sah. */
export async function authenticate(req, res) {
  let token = req.cookies?.[ACCESS]
  let userId

  if (token) {
    const { data, error } = await db().auth.getUser(token)
    if (!error && data.user) userId = data.user.id
  }

  const refreshToken = req.cookies?.[REFRESH]
  if (!userId && refreshToken) {
    const { data, error } = await authClient().auth.refreshSession({ refresh_token: refreshToken })
    if (!error && data.session && data.user) {
      userId = data.user.id
      token = data.session.access_token
      setSessionCookies(res, data.session, true)
    }
  }
  if (!userId) return null

  const profile = await profileOf(userId)
  return profile ? { id: profile.id, name: profile.name, role: profile.role } : null
}

/** Wajib login; pasang `req.user`. */
export async function requireAuth(req, res, next) {
  try {
    const user = await authenticate(req, res)
    if (!user) throw new HttpError(401, 'Silakan masuk dulu.')
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

/** Wajib login dan salah satu peran. */
export const requireRole = (...roles) => [
  requireAuth,
  (req, _res, next) => (roles.includes(req.user.role) ? next() : next(new HttpError(403, 'Anda tidak punya akses ke bagian ini.'))),
]
