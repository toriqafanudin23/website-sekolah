import { X } from 'lucide-react'
import { useEffect, useRef, type CSSProperties } from 'react'
import { NavLink } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { NAV_ITEMS, ROUTES } from '@/config/navigation'
import { PPDB } from '@/config/site'
import { cn } from '@/lib/cn'

interface MobileMenuProps {
  open: boolean
  /** `restoreFocus`: kembalikan fokus ke tombol pembuka (untuk Esc / tombol tutup). */
  onClose: (restoreFocus?: boolean) => void
}

/** Menu layar penuh untuk ponsel dan tablet (di bawah breakpoint `lg`). */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeButtonRef.current?.focus()
  }, [open])

  return (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu navigasi"
      inert={!open}
      className={cn(
        'fixed inset-0 z-50 flex h-dvh flex-col overflow-y-auto bg-grid text-white duration-200 motion-reduce:transition-none lg:hidden',
        // Saat membuka, `visibility` langsung berubah (agar fokus bisa dipindah);
        // saat menutup, `visibility` baru berubah setelah fade-out selesai.
        open ? 'visible opacity-100 transition-opacity' : 'invisible opacity-0 transition-[opacity,visibility]',
      )}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <Logo tone="onDark" showSubtitle={false} onClick={() => onClose()} />
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Tutup menu"
          onClick={() => onClose(true)}
          className="grid size-11 place-items-center bg-accent text-ink transition-colors hover:bg-white"
        >
          <X aria-hidden="true" className="size-[22px]" strokeWidth={2.6} />
        </button>
      </div>

      <nav aria-label="Menu utama" className="flex-1 px-5 py-4">
        {NAV_ITEMS.map(({ label, to }, index) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.home}
            onClick={() => onClose()}
            // Tautan muncul berurutan setiap menu dibuka.
            style={{ '--d': index + 1 } as CSSProperties}
            className={({ isActive }) =>
              cn(
                'block border-t border-white/30 py-3.5 font-display text-[30px] no-underline transition-[color,padding] duration-300 hover:pl-3 hover:text-accent motion-reduce:transition-none',
                open && 'animate-rise',
                isActive && 'text-accent',
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{ '--d': NAV_ITEMS.length + 1 } as CSSProperties}
        className={cn('grid gap-3 p-5', open && 'animate-rise')}
      >
        <Button to={ROUTES.admission} withArrow onClick={() => onClose()}>
          Daftar PPDB {PPDB.year}
        </Button>
        <Button to={ROUTES.admissionStatus} variant="outline" onClick={() => onClose()}>
          Cek status pendaftaran
        </Button>
      </div>
    </div>
  )
}
