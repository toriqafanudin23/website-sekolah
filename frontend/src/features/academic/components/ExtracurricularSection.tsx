import { buttonVariants } from '@/components/ui/Button'
import { KeyValueList, type KeyValue } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { remoteOr, useRemote } from '@/lib/publicApi'
import type { ApiAcademic } from '../api'
import { EXTRACURRICULAR_LIST_URL, EXTRACURRICULARS } from '../content'

const fromApi = ({ extracurriculars }: ApiAcademic): readonly KeyValue[] =>
  extracurriculars.map(({ name, schedule, description }) => ({ label: name, value: schedule || description || '-' }))

export function ExtracurricularSection() {
  const remote = useRemote<ApiAcademic>('/public/academic')
  const items = remoteOr(remote, fromApi, EXTRACURRICULARS)

  return (
    <Section title="Ekstrakurikuler" id="ekstrakurikuler">
      {!items ? (
        <p role="status" className="text-muted">
          Memuat kegiatan…
        </p>
      ) : items.length === 0 ? (
        <p className="text-muted">Belum ada ekstrakurikuler.</p>
      ) : (
        <KeyValueList items={items} />
      )}
      <p className="mt-5 hidden md:block">
        <a href={EXTRACURRICULAR_LIST_URL} className={buttonVariants()}>
          Daftar kegiatan lengkap
        </a>
      </p>
    </Section>
  )
}
