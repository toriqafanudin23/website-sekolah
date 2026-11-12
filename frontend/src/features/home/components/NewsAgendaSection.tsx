import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { PhotoSlot } from '@/components/ui/PhotoSlot'
import { Section } from '@/components/ui/Section'
import { ROUTES } from '@/config/navigation'
import { newsPostFromApi, type ApiAgendaItem, type ApiNewsListItem } from '@/features/information/api'
import { formatDate } from '@/lib/format'
import { remoteOr, useRemote } from '@/lib/publicApi'
import { LATEST_NEWS, UPCOMING_AGENDA } from '../content'
import type { AgendaEvent, NewsPost } from '../types'

const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' })

/** Kartu berita: seluruh kartu bisa diklik (tautan judul meluas lewat `after:absolute`). */
function NewsCard({ post, index }: { post: NewsPost; index: number }) {
  return (
    <article className="group/card relative flex h-full flex-col border-2 border-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-brand transition-colors duration-300 hover:bg-ink hover:text-white motion-reduce:transition-none">
      <PhotoSlot photo={post.photo} placeholder="[Foto berita]" seed={index} className="h-44 md:h-52" />
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <p className="text-sm text-muted transition-colors duration-300 group-hover/card:text-tint motion-reduce:transition-none">
          {post.category}, <time dateTime={post.date}>{formatDate(post.date)}</time>
        </p>
        <h3 className="mt-1.5 text-[21px] leading-[1.15] md:text-2xl md:leading-[1.12]">
          <Link
            to={`${ROUTES.information}/${post.slug}`}
            className="no-underline outline-none after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </h3>
        <ArrowUpRight
          aria-hidden="true"
          className="mt-4 size-6 self-end text-brand transition-[translate,color] duration-300 group-hover/card:-translate-y-1 group-hover/card:translate-x-1 group-hover/card:text-accent motion-reduce:transition-none"
          strokeWidth={2.4}
        />
      </div>
    </article>
  )
}

/** Tanggal berupa blok kuning (hari besar, bulan kecil); hover mengubahnya jadi navy. */
function AgendaTile({ event }: { event: AgendaEvent }) {
  const date = new Date(event.date)
  const day = new Intl.DateTimeFormat('id-ID', { day: 'numeric', timeZone: 'UTC' }).format(date)

  return (
    <div className="group flex items-center gap-4 border-2 border-line p-3 transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white motion-reduce:transition-none">
      <time
        dateTime={event.date}
        className="grid size-16 shrink-0 place-items-center bg-accent text-ink transition-colors duration-300 group-hover:bg-white motion-reduce:transition-none"
      >
        <span className="sr-only">{formatDate(event.date)}</span>
        <span aria-hidden="true" className="text-center leading-none">
          <span className="block font-display text-2xl">{day}</span>
          <span className="mt-1 block text-xs font-bold">{monthFormatter.format(date)}</span>
        </span>
      </time>
      <strong className="font-bold leading-snug">{event.title}</strong>
    </div>
  )
}

const MAX_AGENDA = 4

export function NewsAgendaSection() {
  const newsRemote = useRemote<ApiNewsListItem[]>('/public/news?limit=2')
  const agendaRemote = useRemote<ApiAgendaItem[]>('/public/agenda')

  const posts = remoteOr<ApiNewsListItem[], readonly NewsPost[]>(newsRemote, (items) => items.map(newsPostFromApi), LATEST_NEWS)
  const events = remoteOr<ApiAgendaItem[], readonly AgendaEvent[]>(
    agendaRemote,
    (items) => items.slice(0, MAX_AGENDA).map(({ date, title }) => ({ date, title })),
    UPCOMING_AGENDA,
  )

  return (
    <Section title="Berita dan agenda" id="berita">
      <h3 className="sr-only">Berita terbaru</h3>
      {!posts ? (
        <p role="status" className="text-muted">
          Memuat berita…
        </p>
      ) : posts.length === 0 ? (
        <p className="text-muted">Belum ada berita.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 md:gap-5">
          {posts.map((post, index) => (
            <li key={post.slug}>
              <NewsCard post={post} index={index} />
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-10 mb-4 text-2xl md:mt-12">Agenda terdekat</h3>
      {!events ? (
        <p role="status" className="text-muted">
          Memuat agenda…
        </p>
      ) : events.length === 0 ? (
        <p className="text-muted">Belum ada agenda mendatang.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {events.map((event) => (
            <li key={`${event.date}-${event.title}`}>
              <AgendaTile event={event} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
