import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { FilterChips } from '@/components/ui/FilterChips'
import { PhotoSlot } from '@/components/ui/PhotoSlot'
import { Section } from '@/components/ui/Section'
import { ROUTES } from '@/config/navigation'
import { LATEST_NEWS } from '@/features/home/content'
import type { NewsPost } from '@/features/home/types'
import { formatDate } from '@/lib/format'
import { remoteOr, useRemote } from '@/lib/publicApi'
import { newsPostFromApi, type ApiNewsListItem } from '../api'
import { NEWS_FILTERS, type NewsFilter } from '../content'

function PostMeta({ post }: { post: NewsPost }) {
  return (
    <p className="text-sm text-muted transition-colors duration-300 group-hover/card:text-tint motion-reduce:transition-none">
      {post.category}, <time dateTime={post.date}>{formatDate(post.date)}</time>
    </p>
  )
}

function PostLink({ post }: { post: NewsPost }) {
  return (
    <Link
      to={`${ROUTES.information}/${post.slug}`}
      className="no-underline outline-none after:absolute after:inset-0"
    >
      {post.title}
    </Link>
  )
}

const CARD =
  'group/card relative border-2 border-ink transition-colors duration-300 hover:bg-ink hover:text-white has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-brand motion-reduce:transition-none'

/** Berita dengan filter kategori: berita pertama hasil filter tampil besar, sisanya berupa kartu. */
export function NewsSection() {
  const [filter, setFilter] = useState<NewsFilter>('semua')
  const remote = useRemote<ApiNewsListItem[]>('/public/news?limit=50')
  const all = remoteOr<ApiNewsListItem[], readonly NewsPost[]>(remote, (items) => items.map(newsPostFromApi), LATEST_NEWS)
  const posts = !all ? [] : filter === 'semua' ? all : all.filter(({ category }) => category === filter)
  const [featured, ...others] = posts

  return (
    <Section title="Berita" id="berita">
      <FilterChips options={NEWS_FILTERS} value={filter} onChange={setFilter} label="Filter kategori berita" />

      {!all ? (
        <p role="status" className="mt-5 text-muted">
          Memuat berita…
        </p>
      ) : !featured ? (
        <p className="mt-5 text-muted">Belum ada berita untuk kategori ini.</p>
      ) : (
        <div className="mt-5">
          <article className={CARD}>
            <PhotoSlot photo={featured.photo} placeholder="[Foto berita utama]" seed={0} className="h-50 md:h-85" />
            <div className="p-4 md:p-6">
              <PostMeta post={featured} />
              <h3 className="mt-1 text-[26px] leading-[1.15] md:mt-1.5 md:text-4xl md:leading-[1.12]">
                <PostLink post={featured} />
              </h3>
              <ArrowUpRight
                aria-hidden="true"
                className="mt-4 size-7 text-brand transition-[translate,color] duration-300 group-hover/card:-translate-y-1 group-hover/card:translate-x-1 group-hover/card:text-accent motion-reduce:transition-none"
                strokeWidth={2.4}
              />
            </div>
          </article>

          {others.length > 0 && (
            <ul className="mt-4 grid gap-4 md:mt-5 md:grid-cols-2 md:gap-5">
              {others.map((post) => (
                <li key={post.slug}>
                  <article className={`${CARD} h-full`}>
                    <div className="p-4 md:p-5">
                      <PostMeta post={post} />
                      <h3 className="mt-1 text-[21px] leading-[1.15] md:mt-1.5 md:text-2xl md:leading-[1.12]">
                        <PostLink post={post} />
                      </h3>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  )
}
