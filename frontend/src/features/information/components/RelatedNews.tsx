import { Link } from 'react-router'
import { Section } from '@/components/ui/Section'
import { ROUTES } from '@/config/navigation'
import { LATEST_NEWS } from '@/features/home/content'
import { formatDate } from '@/lib/format'
import { useRemote } from '@/lib/publicApi'
import type { ApiNewsListItem } from '../api'

interface Related {
  slug: string
  title: string
  category: string
  date: string
}

const MAX_RELATED = 3

/** Berita lain. Diminta bersamaan dengan isi berita (komponen bersaudara), jadi tidak ada waterfall. */
export function RelatedNews({ slug }: { slug: string }) {
  const remote = useRemote<ApiNewsListItem[]>('/public/news?limit=5')

  const posts: readonly Related[] =
    remote.kind === 'ready'
      ? remote.data.filter((post) => post.slug !== slug).slice(0, MAX_RELATED)
      : remote.kind === 'unavailable'
        ? LATEST_NEWS.filter((post) => post.slug !== slug)
        : []
  if (posts.length === 0) return null

  return (
    <Section title="Berita lainnya">
      <ul>
        {posts.map((post) => (
          <li
            key={post.slug}
            className="group/card relative -mx-3 border-t border-line px-3 py-4 transition-colors duration-300 first:border-t-0 hover:bg-surface has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand motion-reduce:transition-none"
          >
            <p className="text-sm text-muted">
              {post.category}, <time dateTime={post.date}>{formatDate(post.date)}</time>
            </p>
            <h3 className="mt-1 text-[21px] leading-[1.15] md:text-2xl">
              <Link
                to={`${ROUTES.information}/${post.slug}`}
                className="no-underline outline-none transition-colors duration-200 after:absolute after:inset-0 group-hover/card:text-brand"
              >
                {post.title}
              </Link>
            </h3>
          </li>
        ))}
      </ul>
    </Section>
  )
}
