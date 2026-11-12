import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { ROUTES } from '@/config/navigation'
import { isEditorSession, useAdminSession } from '../session'

/** Pembungkus halaman khusus peran admin: editor dikembalikan ke dashboard (API toh menjawab 403). */
export function AdminOnly({ children }: { children: ReactNode }) {
  const session = useAdminSession()
  if (isEditorSession(session)) return <Navigate to={ROUTES.adminDashboard} replace />
  return children
}
