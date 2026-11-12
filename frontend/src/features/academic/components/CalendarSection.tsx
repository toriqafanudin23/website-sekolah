import { buttonVariants } from '@/components/ui/Button'
import { KeyValueList, type KeyValue } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { formatDate } from '@/lib/format'
import { remoteOr, useRemote } from '@/lib/publicApi'
import type { ApiAcademic } from '../api'
import { ACADEMIC_CALENDAR, CALENDAR_PDF_URL } from '../content'

const fromApi = ({ calendar }: ApiAcademic): readonly KeyValue[] =>
  calendar.map(({ label, startsOn, endsOn }) => ({
    label,
    value: endsOn && endsOn !== startsOn ? `${formatDate(startsOn)} sampai ${formatDate(endsOn)}` : formatDate(startsOn),
  }))

export function CalendarSection() {
  const remote = useRemote<ApiAcademic>('/public/academic')
  const items = remoteOr(remote, fromApi, ACADEMIC_CALENDAR)

  return (
    <Section title="Kalender akademik" id="kalender">
      {!items ? (
        <p role="status" className="text-muted">
          Memuat kalender…
        </p>
      ) : items.length === 0 ? (
        <p className="text-muted">Belum ada kegiatan di kalender akademik.</p>
      ) : (
        <KeyValueList items={items} />
      )}
      <p className="mt-5">
        <a href={CALENDAR_PDF_URL} download className={buttonVariants({ variant: 'dark' })}>
          <span className="md:hidden">Unduh kalender (PDF)</span>
          <span className="hidden md:inline">Unduh kalender akademik (PDF)</span>
        </a>
      </p>
    </Section>
  )
}
