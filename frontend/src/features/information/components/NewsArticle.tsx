import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { PhotoSlot, type PhotoSource } from '@/components/ui/PhotoSlot'
import { ROUTES } from '@/config/navigation'
import { SITE } from '@/config/site'
import { LATEST_NEWS } from '@/features/home/content'
import type { NewsPost } from '@/features/home/types'
import { formatDate } from '@/lib/format'
import { useRemote } from '@/lib/publicApi'
import type { ApiNewsDetail } from '../api'

const PARAGRAPH_BREAK = /\n{2,}/

interface Article {
  title: string
  category: string
  date: string
  body: string
  photo?: PhotoSource
}

const fromApi = (item: ApiNewsDetail): Article => ({
  title: item.title,
  category: item.category,
  date: item.date,
  body: item.body,
  photo: item.coverUrl ? { src: item.coverUrl, alt: item.title } : undefined,
})

/** Cadangan saat API belum aktif: berita statis tidak punya isi lengkap. */
const fromStatic = (post: NewsPost): Article => ({
  title: post.title,
  category: post.category,
  date: post.date,
  body: '',
  photo: post.photo,
})

function CopyLink() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Button variant="outlineDark" size="sm" onClick={copy}>
        Salin tautan berita
      </Button>
      <span role="status" className="text-sm text-muted">
        {copied ? 'Tautan disalin.' : ''}
      </span>
    </div>
  )
}

function NewsMissing() {
  return (
    <Container className="py-10 md:py-16">
      <title>{`Berita tidak ditemukan | ${SITE.name}`}</title>
      <h2 className="text-[32px] leading-[1.15] md:text-5xl">Berita tidak ditemukan</h2>
      <p className="mt-3 mb-6 max-w-xl text-muted">
        Tautan ini mungkin salah, atau beritanya sudah dihapus. Lihat berita terbaru di halaman Informasi.
      </p>
      <Button to={`${ROUTES.information}#berita`} variant="dark" withArrow>
        Lihat semua berita
      </Button>
    </Container>
  )
}

/** Isi satu berita. Teks dirender sebagai paragraf biasa (bukan HTML), sehingga aman dari injeksi markup. */
export function NewsArticle({ slug }: { slug: string }) {
  const remote = useRemote<ApiNewsDetail>(`/public/news/${encodeURIComponent(slug)}`)

  if (remote.kind === 'loading') {
    return (
      <Container className="py-10 md:py-16">
        <p role="status" className="text-muted">
          Memuat berita…
        </p>
      </Container>
    )
  }

  const fallback = LATEST_NEWS.find((post) => post.slug === slug)
  const article =
    remote.kind === 'ready' ? fromApi(remote.data) : remote.kind === 'unavailable' && fallback ? fromStatic(fallback) : undefined
  if (!article) return <NewsMissing />

  const paragraphs = article.body.split(PARAGRAPH_BREAK).map((text) => text.trim()).filter(Boolean)

  return (
    <Container className="py-10 md:py-16">
      <title>{`${article.title} | ${SITE.name}`}</title>
      <article className="max-w-3xl">
        <p className="text-sm text-muted">
          {article.category}, <time dateTime={article.date}>{formatDate(article.date)}</time>
        </p>
        <h2 className="mt-2 text-[32px] leading-[1.15] md:text-5xl md:leading-[1.12]">{article.title}</h2>
        <PhotoSlot photo={article.photo} placeholder="[Foto berita]" className="mt-6 h-52 md:h-96" />

        {paragraphs.length > 0 ? (
          <div className="mt-6 grid gap-4 text-lg">
            {paragraphs.map((text, index) => (
              <p key={index} className="whitespace-pre-line">
                {text}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-muted">Isi lengkap berita ini belum tersedia.</p>
        )}

        <CopyLink />
        <p className="mt-6">
          <Link to={`${ROUTES.information}#berita`} className="font-bold underline underline-offset-4 hover:no-underline">
            Kembali ke daftar berita
          </Link>
        </p>
      </article>
    </Container>
  )
}
