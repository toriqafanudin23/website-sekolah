import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/ui/Section'
import { ROUTES } from '@/config/navigation'
import { SITE } from '@/config/site'
import { GalleryBrowser } from '@/features/gallery/components/GalleryBrowser'

export default function GalleryPage() {
  return (
    <>
      <title>{`Galeri | ${SITE.name}`}</title>
      <PageHero
        breadcrumb={[{ label: 'Beranda', to: ROUTES.home }, { label: 'Galeri' }]}
        title="Galeri"
        description="Foto kegiatan belajar dan keseharian di sekolah."
      />
      <Section title="Foto kegiatan" id="foto" reveal={false}>
        <GalleryBrowser />
      </Section>
    </>
  )
}
