import { Button } from '@/components/ui/Button'
import { ProgramCard } from '@/components/ui/ProgramCard'
import { Section } from '@/components/ui/Section'
import { ROUTES } from '@/config/navigation'
import { ACADEMIC_PROGRAMS } from '../content'

export function AcademicSection() {
  return (
    <Section title="Akademik" tone="dark" id="akademik">
      <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
        {ACADEMIC_PROGRAMS.map((program) => (
          <li key={program.title}>
            <ProgramCard {...program} />
          </li>
        ))}
      </ul>

      <div className="mt-6 md:mt-8">
        <Button to={ROUTES.academic} withArrow>
          Semua program akademik
        </Button>
      </div>
    </Section>
  )
}
