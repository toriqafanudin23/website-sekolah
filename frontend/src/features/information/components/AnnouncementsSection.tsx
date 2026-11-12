import { KeyValueList } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { formatDate } from '@/lib/format'
import { remoteOr, useRemote } from '@/lib/publicApi'
import type { ApiAnnouncement } from '../api'
import { ANNOUNCEMENTS } from '../content'

/** Pengumuman dari panel admin: tanggal, judul, dan isi (bila ada). Cadangan statis hanya bila API tidak aktif. */
export function AnnouncementsSection() {
  const remote = useRemote<ApiAnnouncement[]>('/public/announcements')
  const items = remoteOr<ApiAnnouncement[], readonly ApiAnnouncement[] | null>(remote, (data) => data, null)

  return (
    <Section title="Pengumuman" id="pengumuman">
      {items === undefined ? (
        <p role="status" className="text-muted">
          Memuat pengumuman…
        </p>
      ) : items === null ? (
        <KeyValueList items={ANNOUNCEMENTS} />
      ) : items.length === 0 ? (
        <p className="text-muted">Belum ada pengumuman.</p>
      ) : (
        <ul>
          {items.map(({ id, title, body, date }) => (
            <li key={id} className="-mx-3 border-t border-line px-3 py-3.5 transition-colors duration-300 hover:bg-surface md:py-4 motion-reduce:transition-none">
              <p className="text-sm text-muted">
                <time dateTime={date}>{formatDate(date)}</time>
              </p>
              <strong className="mt-0.5 block">{title}</strong>
              {body ? <p className="mt-1.5 whitespace-pre-line text-muted">{body}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
