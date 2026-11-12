import { Photo } from '@/components/ui/Photo'
import { cn } from '@/lib/cn'
import { placeholderPhoto } from '@/lib/placeholderPhotos'

export interface PhotoSource {
  src: string
  alt: string
  srcSet?: string
}

interface PhotoSlotProps {
  /** Foto asli. Selama belum ada, dipakai foto sementara (lihat `lib/placeholderPhotos.ts`). */
  photo?: PhotoSource
  /** Nama slot, dipakai sebagai keterangan foto sementara dan teks cadangan, mis. `[Foto Kepala Sekolah]`. */
  placeholder: string
  /**
   * Penentu foto sementara. Beri nilai berbeda (mis. indeks kartu) agar kartu bersebelahan
   * tidak memakai foto yang sama. Bawaan: dari teks `placeholder`.
   */
  seed?: string | number
  /** Wajib memuat tinggi, mis. `h-50 md:h-75`. */
  className?: string
}

/**
 * Slot foto: menampilkan foto bila sudah tersedia, atau foto sementara bila belum.
 * Gambar membesar halus saat kartu induk (`group/card`) atau slot ini di-hover.
 * Cukup isi `photo` di file content untuk mengganti tanpa mengubah komponen.
 */
export function PhotoSlot({ photo, placeholder, seed, className }: PhotoSlotProps) {
  const temporary = placeholderPhoto(seed ?? placeholder, `Foto sementara: ${placeholder.replace(/[[\]]/g, '')}`)
  const shown = photo ?? temporary

  return (
    <div className={cn('group/photo overflow-hidden bg-accent', className)}>
      <Photo
        src={shown.src}
        srcSet={shown.srcSet}
        alt={shown.alt}
        fallbackSrc={temporary.src}
        fallbackSrcSet={temporary.srcSet}
        fallbackLabel={placeholder}
        className="size-full transition-transform duration-700 ease-out group-hover/card:scale-[1.07] group-hover/photo:scale-[1.07] motion-reduce:transition-none"
      />
    </div>
  )
}
