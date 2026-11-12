import { useState, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

interface PhotoProps extends Omit<ComponentProps<'img'>, 'alt' | 'src'> {
  src: string
  alt: string
  /** Foto di atas lipatan layar (LCP): dimuat segera dengan prioritas tinggi. */
  priority?: boolean
  /** Teks yang tampil bila gambar gagal dimuat. Bawaan: `alt`. */
  fallbackLabel?: string
  /** Gambar pengganti bila `src` gagal dimuat (mis. berkas foto sekolah belum diunggah). */
  fallbackSrc?: string
  fallbackSrcSet?: string
}

/**
 * Gambar dengan lazy-loading dan dua lapis cadangan bila gagal dimuat:
 * pertama `fallbackSrc` (bila ada), lalu kotak berisi teks. Tata letak tidak pecah.
 * Latar kuning disediakan induknya (`bg-accent`) sebagai warna saat memuat.
 */
export function Photo({
  alt,
  priority = false,
  fallbackLabel,
  fallbackSrc,
  fallbackSrcSet,
  src,
  srcSet,
  className,
  ...props
}: PhotoProps) {
  const [stage, setStage] = useState<'main' | 'fallback' | 'failed'>('main')

  if (stage === 'failed') {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('flex items-center justify-center p-4 text-center text-sm text-ink', className)}
      >
        {fallbackLabel ?? alt}
      </div>
    )
  }

  const useFallback = stage === 'fallback' && fallbackSrc !== undefined

  return (
    <img
      alt={alt}
      src={useFallback ? fallbackSrc : src}
      srcSet={useFallback ? fallbackSrcSet : srcSet}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setStage(fallbackSrc !== undefined && stage === 'main' ? 'fallback' : 'failed')}
      className={cn('object-cover', className)}
      {...props}
    />
  )
}
