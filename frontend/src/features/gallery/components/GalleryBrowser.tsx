import { ZoomIn } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PhotoSlot } from '@/components/ui/PhotoSlot'
import { Reveal } from '@/components/ui/Reveal'
import { GALLERY } from '@/features/information/content'
import type { ApiGalleryItem } from '@/features/information/api'
import { useRemote } from '@/lib/publicApi'
import { Lightbox, type GalleryEntry } from './Lightbox'

const PAGE_SIZE = 12

/** Cadangan saat API belum aktif: hanya foto yang sudah ada gambarnya. */
const STATIC_ENTRIES: readonly GalleryEntry[] = GALLERY.flatMap(({ caption, photo }) =>
  photo ? [{ id: caption, caption, src: photo.src, srcSet: photo.srcSet, alt: photo.alt }] : [],
)

const fromApi = (item: ApiGalleryItem): GalleryEntry => ({
  id: item.id,
  caption: item.caption,
  src: item.imageUrl,
  alt: item.caption,
})

/** Grid foto dengan muat bertahap dan pembesar foto. Foto di luar layar dilewati render (`content-visibility`). */
export function GalleryBrowser() {
  const remote = useRemote<ApiGalleryItem[]>('/public/gallery')
  const [shown, setShown] = useState(PAGE_SIZE)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (remote.kind === 'loading') {
    return (
      <p role="status" className="text-muted">
        Memuat foto…
      </p>
    )
  }

  const entries: readonly GalleryEntry[] = remote.kind === 'ready' ? remote.data.map(fromApi) : STATIC_ENTRIES
  if (entries.length === 0) return <p className="text-muted">Belum ada foto.</p>

  const visible = entries.slice(0, shown)

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {visible.map((entry, index) => (
          // Tiap foto muncul saat masuk layar; `index % 3` membuat satu baris muncul berurutan.
          <Reveal
            as="li"
            key={entry.id}
            index={index % 3}
            effect="zoom"
            className="[contain-intrinsic-size:auto_220px] [content-visibility:auto]"
          >
            <button type="button" onClick={() => setOpenIndex(index)} className="group/card block w-full text-left">
              <span className="relative block">
                <PhotoSlot
                  photo={{ src: entry.src, srcSet: entry.srcSet, alt: entry.alt }}
                  placeholder="[Foto]"
                  seed={index}
                  className="h-32 md:h-48"
                />
                {/* Lapisan biru dengan ikon pembesar saat hover atau fokus. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center bg-brand/70 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 group-focus-visible/card:opacity-100 motion-reduce:transition-none"
                >
                  <span className="grid size-12 place-items-center bg-accent text-ink">
                    <ZoomIn className="size-6" strokeWidth={2.4} />
                  </span>
                </span>
              </span>
              <span className="mt-1.5 block text-sm transition-colors duration-200 group-hover/card:text-brand md:mt-2 md:text-base">
                {entry.caption}
              </span>
              <span className="sr-only">Perbesar foto</span>
            </button>
          </Reveal>
        ))}
      </ul>

      {shown < entries.length ? (
        <div className="mt-8">
          <Button variant="outlineDark" onClick={() => setShown((count) => count + PAGE_SIZE)}>
            Muat lebih banyak
          </Button>
        </div>
      ) : null}

      {openIndex !== null ? (
        <Lightbox entries={entries} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      ) : null}
    </>
  )
}
