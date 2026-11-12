import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'

type RevealEffect = 'up' | 'left' | 'right' | 'zoom'
type RevealTag = 'div' | 'li' | 'article' | 'p' | 'figure' | 'span' | 'section'

interface RevealProps {
  as?: RevealTag
  className?: string
  children: ReactNode
  /**
   * `false` (bawaan): elemen ini sendiri yang muncul.
   * `true`: anak langsung dan item daftar (`ul`/`ol`/`dl`) di dalamnya muncul satu per satu.
   */
  group?: boolean
  /** Hanya untuk `group={false}`: urutan, menambah jeda 90 ms per angka (maks. 8). */
  index?: number
  effect?: RevealEffect
}

/**
 * Animasi muncul saat di-scroll. Gaya ada di `index.css` ([data-reveal], [data-reveal-group]);
 * mati otomatis bila pengguna memilih "kurangi gerakan" dan saat dicetak.
 */
export function Reveal({ as = 'div', className, children, group = false, index = 0, effect = 'up' }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>()
  const Component: ElementType = as

  const state = inView ? 'true' : 'false'
  const style = { '--reveal-i': Math.min(index, 8) } as CSSProperties

  return group ? (
    <Component ref={ref} className={className} data-reveal-group="" data-in-view={state}>
      {children}
    </Component>
  ) : (
    <Component ref={ref} className={className} style={style} data-reveal={effect} data-in-view={state}>
      {children}
    </Component>
  )
}
