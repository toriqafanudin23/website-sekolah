import { NavLink } from 'react-router'
import { ADMIN_NAV_ITEMS, ADMIN_ONLY_ROUTES, ROUTES } from '@/config/navigation'
import { cn } from '@/lib/cn'
import { isEditorSession, useAdminSession } from '../session'

interface AdminNavProps {
  /** Dipanggil saat tautan diklik (menutup menu ponsel). */
  onNavigate?: () => void
  className?: string
}

/** Daftar menu panel admin; dipakai sidebar desktop dan menu ponsel. */
export function AdminNav({ onNavigate, className }: AdminNavProps) {
  const editor = isEditorSession(useAdminSession())
  const items = editor ? ADMIN_NAV_ITEMS.filter(({ to }) => !ADMIN_ONLY_ROUTES.includes(to)) : ADMIN_NAV_ITEMS

  return (
    <nav aria-label="Menu panel admin" className={className}>
      <ul>
        {items.map(({ label, to }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === ROUTES.adminDashboard}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'block px-7 py-3 no-underline transition-colors motion-reduce:transition-none',
                  isActive ? 'bg-accent font-bold text-ink' : 'text-white hover:bg-white/10',
                )
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
