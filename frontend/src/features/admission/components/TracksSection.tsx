import { Section } from '@/components/ui/Section'
import { ADMISSION_TRACKS } from '../content'

export function TracksSection() {
  return (
    <Section title="Jalur pendaftaran" id="jalur">
      <ul>
        {ADMISSION_TRACKS.map(({ title, description }) => (
          <li
            key={title}
            className="group -mx-3 border-t border-line px-3 py-4 transition-colors duration-300 hover:bg-surface md:grid md:grid-cols-[1fr_1.3fr] md:gap-6 md:py-4 motion-reduce:transition-none"
          >
            <h3 className="text-xl transition-colors duration-200 group-hover:text-brand md:text-[22px]">{title}</h3>
            <p className="mt-1 text-muted md:mt-0">{description}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
