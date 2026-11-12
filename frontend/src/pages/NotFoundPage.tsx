import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { ROUTES } from '@/config/navigation'
import { SITE } from '@/config/site'

/** Halaman untuk alamat yang tidak ada. Berbeda dari ComingSoonPage, yang untuk halaman yang akan dibuat. */
export default function NotFoundPage() {
  return (
    <section className="bg-grid pt-(--header-h) text-white">
      <title>{`Halaman tidak ditemukan | ${SITE.name}`}</title>
      <Container className="py-16 md:py-24">
        <p className="font-bold">Galat 404</p>
        <h1 className="mt-4 text-[42px] leading-[1.15] md:text-6xl">Halaman tidak ditemukan.</h1>
        <p className="mt-4 mb-8 max-w-xl text-lg text-tint">
          Alamat yang Anda buka tidak ada atau sudah dipindahkan. Coba mulai dari beranda.
        </p>
        <div className="grid gap-3 md:flex">
          <Button to={ROUTES.home} withArrow>
            Kembali ke beranda
          </Button>
          <Button to={ROUTES.information} variant="outline">
            Lihat informasi
          </Button>
        </div>
      </Container>
    </section>
  )
}
