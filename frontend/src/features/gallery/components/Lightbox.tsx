import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'

export interface GalleryEntry {
  id: string
  caption: string
  src: string
  srcSet?: string
  alt: string
}

interface LightboxProps {
  entries: readonly GalleryEntry[]
  index: number
  onChange: (index: number) => void
  onClose: () => void
}

const NAV_BUTTON = 'inline-flex min-h-12 items-center gap-1 px-4 font-bold ring-2 ring-white ring-inset hover:bg-white hover:text-ink'

/** Pembesar foto di dalam `<dialog>`: fokus terkunci, Esc menutup, panah kiri dan kanan berpindah foto. */
export function Lightbox({ entries, index, onChange, onClose }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const entry = entries[index]

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  if (!entry) return null

  const go = (step: number) => onChange((index + step + entries.length) % entries.length)

  return (
    <dialog
      ref={ref}
      aria-label={`Foto: ${entry.caption}`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') go(-1)
        if (event.key === 'ArrowRight') go(1)
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-4xl bg-ink p-4 text-white backdrop:bg-ink/85 md:p-6"
    >
      <figure>
        <img
          src={entry.src}
          srcSet={entry.srcSet}
          sizes="(min-width: 64rem) 56rem, 100vw"
          alt={entry.alt}
          className="mx-auto max-h-[68dvh] w-auto max-w-full object-contain"
        />
        <figcaption className="mt-3 text-center">
          {entry.caption} <span className="text-tint">({index + 1} dari {entries.length})</span>
        </figcaption>
      </figure>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => go(-1)} disabled={entries.length < 2} className={NAV_BUTTON}>
          <ChevronLeft aria-hidden="true" className="size-5" />
          Sebelumnya
        </button>
        <button type="button" onClick={onClose} className="min-h-12 bg-accent px-5 font-bold text-ink hover:bg-white">
          Tutup
        </button>
        <button type="button" onClick={() => go(1)} disabled={entries.length < 2} className={NAV_BUTTON}>
          Berikutnya
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
    </dialog>
  )
}
