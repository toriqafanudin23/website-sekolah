import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Container } from './Container'
import { Reveal } from './Reveal'

type SectionTone = 'light' | 'dark'

const TONES: Record<SectionTone, { section: string; rule: string }> = {
  light: { section: 'border-ink', rule: 'border-ink' },
  dark: { section: 'bg-grid text-white border-accent', rule: 'border-accent' },
}

interface SectionProps {
  /** Label di kolom kiri (desktop) / di atas konten (ponsel). */
  title: string
  tone?: SectionTone
  id?: string
  /**
   * Isi section muncul bertahap saat di-scroll (anak langsung dan item daftar satu per satu).
   * Matikan (`false`) bila isinya sudah mengatur animasinya sendiri.
   */
  reveal?: boolean
  children: ReactNode
}

/**
 * Pola section utama beranda: garis tebal di atas, label di kiri, konten di kanan.
 * Ponsel: satu kolom dan garis selebar layar. Desktop: dua kolom (1 : 2.4) dan garis selebar konten.
 */
export function Section({ title, tone = 'light', id, reveal = true, children }: SectionProps) {
  const headingId = useId()
  const styles = TONES[tone]

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      // scroll-mt: navbar sticky tidak menutupi judul saat tautan #id diklik.
      className={cn('scroll-mt-(--header-h) border-t-2 md:border-t-0', styles.section)}
    >
      <Container className="py-10 md:py-0">
        <div
          className={cn(
            'md:grid md:grid-cols-[1fr_2.4fr] md:gap-10 md:border-t-2 md:py-16',
            styles.rule,
          )}
        >
          <Reveal effect="left">
            <h2 id={headingId} className="mb-4 font-sans text-[17px] font-bold md:mb-0 md:text-lg">
              {title}
            </h2>
          </Reveal>
          {reveal ? <Reveal group>{children}</Reveal> : <div>{children}</div>}
        </div>
      </Container>
    </section>
  )
}
