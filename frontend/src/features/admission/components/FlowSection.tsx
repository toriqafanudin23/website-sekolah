import { Section } from '@/components/ui/Section'
import { ADMISSION_FLOW } from '../content'

export function FlowSection() {
  return (
    <Section title="Alur pendaftaran" id="alur">
      <ol>
        {ADMISSION_FLOW.map(({ title, description }, index) => (
          <li
            key={title}
            className="group -mx-3 grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3 border-t border-line px-3 py-3.5 transition-colors duration-300 hover:bg-surface md:grid-cols-[3.5rem_14rem_1fr] md:gap-x-6 md:py-4 motion-reduce:transition-none"
          >
            <span
              aria-hidden="true"
              className="font-display text-2xl leading-none transition-colors duration-200 group-hover:text-brand md:text-[28px]"
            >
              {index + 1}
            </span>
            <h3 className="font-sans text-base font-bold md:font-display md:text-xl md:font-normal">{title}</h3>
            <p className="col-start-2 text-muted md:col-start-auto">{description}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
