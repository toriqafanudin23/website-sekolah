import { PhotoSlot } from '@/components/ui/PhotoSlot'
import { Section } from '@/components/ui/Section'
import { remoteOr, useRemote } from '@/lib/publicApi'
import type { ApiGalleryItem } from '../api'
import { GALLERY } from '../content'
import type { GalleryPhoto } from '../types'

const PREVIEW_COUNT = 6

const fromApi = (items: ApiGalleryItem[]): readonly GalleryPhoto[] =>
  items.slice(0, PREVIEW_COUNT).map(({ caption, imageUrl }) => ({ caption, photo: { src: imageUrl, alt: caption } }))

/** Cuplikan galeri; seluruh foto ada di halaman Galeri. */
export function GallerySection() {
  const remote = useRemote<ApiGalleryItem[]>('/public/gallery')
  const items = remoteOr(remote, fromApi, GALLERY)

  return (
    <Section title="Galeri" id="galeri">
      {!items ? (
        <p role="status" className="text-muted">
          Memuat foto…
        </p>
      ) : items.length === 0 ? (
        <p className="text-muted">Belum ada foto.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {items.map(({ caption, shortCaption, photo }, index) => (
            <li key={`${caption}-${index}`} className="group/card">
              <PhotoSlot photo={photo} placeholder="[Foto]" seed={index} className="h-30 md:h-45" />
              <span className="mt-1.5 block text-sm transition-colors duration-200 group-hover/card:text-brand md:mt-2 md:text-base">
                {shortCaption ? (
                  <>
                    <span className="md:hidden">{shortCaption}</span>
                    <span className="hidden md:inline">{caption}</span>
                  </>
                ) : (
                  caption
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
