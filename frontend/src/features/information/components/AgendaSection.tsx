import { KeyValueList, type KeyValue } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { UPCOMING_AGENDA } from '@/features/home/content'
import { formatDate } from '@/lib/format'
import { remoteOr, useRemote } from '@/lib/publicApi'
import type { ApiAgendaItem } from '../api'

const STATIC_ITEMS: readonly KeyValue[] = UPCOMING_AGENDA.map(({ date, title }) => ({ label: formatDate(date), value: title }))

const fromApi = (items: ApiAgendaItem[]): readonly KeyValue[] =>
  items.map(({ date, title, location }) => ({ label: formatDate(date), value: location ? `${title}, ${location}` : title }))

export function AgendaSection() {
  const remote = useRemote<ApiAgendaItem[]>('/public/agenda')
  const items = remoteOr(remote, fromApi, STATIC_ITEMS)

  return (
    <Section title="Agenda" id="agenda" tone="dark">
      {!items ? (
        <p role="status">Memuat agenda…</p>
      ) : items.length === 0 ? (
        <p>Belum ada agenda mendatang.</p>
      ) : (
        <KeyValueList items={items} tone="dark" stackOnMobile />
      )}
    </Section>
  )
}
