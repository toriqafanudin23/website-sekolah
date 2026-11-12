import { KeyValueList } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { useSettings, withSettings } from '@/lib/siteData'
import { SCHOOL_IDENTITY } from '../content'

/** Baris yang bisa diubah admin lewat Pengaturan situs; baris lain (NPSN, status, dst.) tetap dari `content.ts`. */
const SETTING_KEYS = {
  Akreditasi: 'school.accreditation',
  Alamat: 'contact.address',
  'Kepala sekolah': 'headmaster.name',
} as const

export function IdentitySection() {
  const settings = useSettings()

  return (
    <Section title="Identitas" id="identitas">
      <KeyValueList items={withSettings(SCHOOL_IDENTITY, settings, SETTING_KEYS)} />
    </Section>
  )
}
