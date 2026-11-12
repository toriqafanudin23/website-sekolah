import { useParams } from 'react-router'
import { PageHero } from '@/components/layout/PageHero'
import { ROUTES } from '@/config/navigation'
import { NewsArticle } from '@/features/information/components/NewsArticle'
import { RelatedNews } from '@/features/information/components/RelatedNews'

export default function NewsDetailPage() {
  const { slug = '' } = useParams()

  return (
    <>
      <PageHero
        breadcrumb={[
          { label: 'Beranda', to: ROUTES.home },
          { label: 'Informasi', to: ROUTES.information },
          { label: 'Berita' },
        ]}
        title="Berita"
        description="Kabar terbaru dari sekolah."
      />
      <NewsArticle slug={slug} />
      <RelatedNews slug={slug} />
    </>
  )
}
