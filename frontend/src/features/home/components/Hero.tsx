import { CalendarCheck } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Photo } from '@/components/ui/Photo'
import { ROUTES } from '@/config/navigation'
import { PPDB, SITE } from '@/config/site'
import { HERO_PHOTO } from '../content'

/** Jeda animasi masuk: `--d` dikali 110 ms (lihat `animate-rise` di index.css). */
const step = (n: number) => ({ '--d': n }) as CSSProperties

/**
 * Hero berlatar biru berkisi. Navbar menimpa bagian atas section ini,
 * sehingga padding atas memakai `--header-h`.
 * Ponsel: teks lalu foto. Desktop: teks di kiri, foto menempel ke dasar section di kanan.
 * Satu urutan masuk saat halaman dimuat: judul, deskripsi, tombol, lalu foto.
 */
export function Hero() {
  return (
    <section className="overflow-hidden bg-grid pt-(--header-h) text-white">
      <Container className="pt-10 lg:grid lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-12 lg:pt-6">
        <div className="lg:pb-18">
          <h1
            style={step(0)}
            className="animate-rise text-[42px] leading-[1.15] md:text-[56px] lg:text-[68px] lg:leading-[1.12]"
          >
            {SITE.tagline}
          </h1>
          <p
            style={step(1)}
            className="animate-rise mt-4 mb-6 text-[17px] text-tint lg:mt-6 lg:mb-8 lg:max-w-[520px] lg:text-xl"
          >
            {SITE.description}
          </p>

          <div style={step(2)} className="animate-rise grid gap-3 lg:flex">
            <Button to={ROUTES.admission} withArrow>
              Daftar PPDB {PPDB.year}
            </Button>
            <Button to={ROUTES.profile} variant="outline">
              Lihat profil sekolah
            </Button>
          </div>
        </div>

        <div style={step(3)} className="animate-rise relative mt-12 mr-3 lg:mt-0 lg:mr-0">
          {/* Bingkai kuning bergeser di belakang foto. */}
          <div
            aria-hidden="true"
            className="absolute -top-3 -right-3 size-full border-2 border-accent lg:-top-4 lg:-right-4"
          />

          <div className="relative h-72 overflow-hidden bg-accent lg:h-130">
            <Photo
              priority
              src={HERO_PHOTO.src}
              sizes="(min-width: 1024px) 480px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)"
              alt={HERO_PHOTO.alt}
              fallbackLabel={HERO_PHOTO.fallbackLabel}
              className="size-full object-[center_30%]"
            />
          </div>

          {/* Kartu informasi PPDB yang menempel di sudut foto. */}
          <div className="absolute bottom-4 left-4 flex max-w-[calc(100%-2rem)] items-center gap-3 bg-white p-3 pr-4 text-ink shadow-block-ink lg:-left-10 lg:bottom-10 lg:p-4 lg:pr-5">
            <span className="grid size-10 shrink-0 place-items-center bg-accent lg:size-11">
              <CalendarCheck aria-hidden="true" className="size-5 lg:size-6" strokeWidth={2.2} />
            </span>
            <p className="leading-tight">
              <strong className="block text-[15px] lg:text-base">PPDB {PPDB.year} dibuka</strong>
              <span className="text-[13px] text-muted lg:text-sm">{PPDB.period}</span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
