import type { PhotoSource } from '@/components/ui/PhotoSlot'

/**
 * Foto sementara (Unsplash) untuk slot yang belum punya foto asli.
 * Ganti dengan foto sekolah: cukup isi `photo` pada data terkait, slot ini otomatis tidak dipakai lagi.
 */
const SOURCES = [
  'https://plus.unsplash.com/premium_photo-1680807869780-e0876a6f3cd5',
  'https://plus.unsplash.com/premium_photo-1683121148094-2c7ef2a87b1d',
  'https://images.unsplash.com/photo-1588072432836-e10032774350',
  'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a',
] as const

const WIDTHS = [400, 640, 960, 1280] as const
const DEFAULT_WIDTH = 960

const buildUrl = (base: string, width: number) =>
  `${base}?q=80&w=${width}&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D`

/** Angka tetap dari sebuah teks, supaya foto sementara sebuah kartu tidak berganti tiap render. */
export function hashSeed(value: string | number): number {
  if (typeof value === 'number') return Math.abs(Math.trunc(value))

  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Foto sementara ke-`seed` (berputar di antara empat foto yang tersedia). */
export function placeholderPhoto(seed: string | number, alt: string): PhotoSource {
  const base = SOURCES[hashSeed(seed) % SOURCES.length]

  return {
    src: buildUrl(base, DEFAULT_WIDTH),
    srcSet: WIDTHS.map((width) => `${buildUrl(base, width)} ${width}w`).join(', '),
    alt,
  }
}
