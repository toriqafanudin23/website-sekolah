import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { config } from '../config.js'
import { HttpError } from '../lib/http.js'

export const securityHeaders = helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })

export const corsMiddleware = cors({
  origin: (origin, callback) => callback(null, !origin || config.allowedOrigins.includes(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-upload-token'],
  maxAge: 600,
})

/**
 * Pelindung CSRF: permintaan yang mengubah data dari browser selalu membawa header Origin.
 * Origin yang tidak terdaftar ditolak. Tanpa Origin (curl, server ke server) diizinkan; cookie sesi
 * tidak dikirim otomatis oleh klien non-browser.
 */
export function checkOrigin(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  if (origin && !config.allowedOrigins.includes(origin)) return next(new HttpError(403, 'Asal permintaan tidak diizinkan.'))
  next()
}

/**
 * Pembatas laju per IP. Catatan: di Vercel, memori tiap instance fungsi terpisah, jadi batas ini
 * melunakkan serangan tetapi bukan jaminan keras. Untuk jaminan keras pakai penyimpanan bersama (mis. Upstash).
 */
export const limiter = (windowMinutes, limit) =>
  rateLimit({
    windowMs: windowMinutes * 60_000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.' }),
  })

export const publicCache = (_req, res, next) => {
  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  next()
}
