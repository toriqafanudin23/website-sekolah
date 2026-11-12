import { KeyValueList } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { useSettings, withSettings } from '@/lib/siteData'
import { CONTACT_ROWS } from '../content'

/** Label baris di `CONTACT_ROWS` -> kunci Pengaturan situs. */
const SETTING_KEYS = {
  Alamat: 'contact.address',
  'Telepon / WhatsApp': 'contact.phone',
  Email: 'contact.email',
  'Jam layanan': 'contact.hours',
} as const

export function ContactInfoSection() {
  const settings = useSettings()

  return (
    <Section title="Hubungi kami" id="hubungi">
      <KeyValueList items={withSettings(CONTACT_ROWS, settings, SETTING_KEYS)} stackOnMobile />
    </Section>
  )
}
