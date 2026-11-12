import { redirect, useRouteLoaderData } from 'react-router'
import { ADMIN_ROUTE_ID, ROUTES } from '@/config/navigation'
import { fetchSession, type AdminSession } from './api'

/**
 * Loader rute /admin: hanya admin yang sudah masuk boleh lewat, selain itu ke halaman login.
 * Sesi demo (tanpa backend) ditangani di fetchSession; lihat demo.ts.
 */
export async function requireAdmin(): Promise<AdminSession> {
  let session: AdminSession | null = null
  try {
    session = await fetchSession()
  } catch {
    // Server tidak terjangkau: perlakukan sebagai belum masuk.
  }
  if (!session) throw redirect(ROUTES.adminLogin)
  return session
}

/** Sesi dari loader rute /admin, untuk komponen di dalam panel. */
export const useAdminSession = (): AdminSession | undefined => useRouteLoaderData<AdminSession>(ADMIN_ROUTE_ID)

/** Editor tidak boleh membuka PPDB dan Pengaturan situs. Sesi demo dan sesi tanpa peran dianggap admin. */
export const isEditorSession = (session: AdminSession | undefined): boolean => session?.role === 'editor'
