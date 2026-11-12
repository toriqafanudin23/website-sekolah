import { KeyValueList } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { linesOf, setting, useSettings } from '@/lib/siteData'
import { MISSIONS, VISION } from '../content'

export function VisionMissionSection() {
  const settings = useSettings()
  const written = linesOf(settings['school.missions'])
  const missions = written.length > 0 ? written.map((value, index) => ({ label: `Misi ${index + 1}`, value })) : MISSIONS

  return (
    <Section title="Visi dan misi" id="visi-misi" tone="dark">
      <p className="mb-5 font-display text-2xl leading-[1.35] md:mb-7 md:text-[38px] md:leading-[1.3]">
        {setting(settings, 'school.vision', VISION)}
      </p>
      <KeyValueList items={missions} tone="dark" />
    </Section>
  )
}
