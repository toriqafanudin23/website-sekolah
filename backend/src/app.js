import cookieParser from 'cookie-parser'
import express from 'express'
import { HttpError } from './lib/http.js'
import { checkOrigin, corsMiddleware, securityHeaders } from './middleware/security.js'
import { admissionRouter } from './routes/admission.js'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'
import { messagesRouter } from './routes/messages.js'
import { publicRouter } from './routes/public.js'
import { resourcesRouter } from './routes/resources.js'
import { settingsRouter } from './routes/settings.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  // Di balik proxy Vercel: IP klien dari X-Forwarded-For (dipakai pembatas laju).
  app.set('trust proxy', 1)

  app.use(securityHeaders)
  app.use(corsMiddleware)
  app.use(checkOrigin)
  app.use(cookieParser())
  // Batas 4 MB: foto dari panel berupa data URL; fungsi Vercel menolak badan di atas 4,5 MB.
  app.use(express.json({ limit: '4mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true }))
  app.use(authRouter)
  app.use(publicRouter)
  app.use(admissionRouter)
  app.use(messagesRouter)
  app.use(dashboardRouter)
  app.use(settingsRouter)
  app.use(resourcesRouter())

  app.use((_req, _res, next) => next(new HttpError(404, 'Alamat tidak ditemukan.')))

  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Berkas atau isian terlalu besar.' })
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Badan permintaan bukan JSON yang sah.' })
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message })
    console.error('[error]', error)
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' })
  })

  return app
}
