import { Router } from 'express'
import { asyncHandler, HttpError, requireJson } from '../lib/http.js'
import { isEmail } from '../lib/pure.js'
import { authClient, db } from '../supabase.js'
import { authenticate, clearSessionCookies, setSessionCookies } from '../middleware/auth.js'
import { limiter } from '../middleware/security.js'

export const authRouter = Router()

const INVALID = 'Email atau kata sandi tidak cocok.'

authRouter.post(
  '/auth/login',
  limiter(15, 10),
  requireJson,
  asyncHandler(async (req, res) => {
    const { email, password, remember } = req.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || !isEmail(email) || password.length < 1 || password.length > 200) {
      throw new HttpError(401, INVALID)
    }

    const { data, error } = await authClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error || !data.session || !data.user) throw new HttpError(401, INVALID)

    // Akun Supabase tanpa profil admin aktif tidak boleh masuk panel; pesan sama agar akun tidak bisa ditebak.
    const { data: profile } = await db().from('admin_profiles').select('name, role, is_active').eq('id', data.user.id).maybeSingle()
    if (!profile?.is_active) throw new HttpError(401, INVALID)

    setSessionCookies(res, data.session, Boolean(remember))
    res.json({ name: profile.name, role: profile.role })
  }),
)

authRouter.get(
  '/auth/me',
  asyncHandler(async (req, res) => {
    const user = await authenticate(req, res)
    if (!user) throw new HttpError(401, 'Silakan masuk dulu.')
    res.json({ name: user.name, role: user.role })
  }),
)

authRouter.post('/auth/logout', (_req, res) => {
  clearSessionCookies(res)
  res.status(204).end()
})
