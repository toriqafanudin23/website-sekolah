import { ProgramCard } from '@/components/ui/ProgramCard'
import { Section } from '@/components/ui/Section'
import { ACADEMIC_PROGRAMS } from '@/features/home/content'

/** Daftar program unggulan: kartu 1 kolom di ponsel, 2 kolom di layar lebar. */
export function FlagshipProgramsSection() {
  return (
    <Section title="Program unggulan" id="program" tone="dark">
      <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
        {ACADEMIC_PROGRAMS.map((program) => (
          <li key={program.title}>
            <ProgramCard {...program} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
