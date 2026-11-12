import { Section } from '@/components/ui/Section'
import { setting, useSettings } from '@/lib/siteData'
import { ABOUT_STATEMENT, SCHOOL_STATS } from '../content'

export function AboutSection() {
  const settings = useSettings()

  return (
    <Section title="Tentang sekolah" id="tentang">
      <p className="mb-6 font-display text-2xl leading-[1.35] md:mb-8 md:text-[32px] md:leading-[1.3]">
        {ABOUT_STATEMENT}
      </p>

      <dl className="grid grid-cols-2 gap-3 md:gap-4">
        {SCHOOL_STATS.map(({ label, shortLabel, value, settingKey }) => (
          <div
            key={label}
            className="group flex flex-col-reverse justify-between gap-6 border-2 border-ink p-4 transition-colors duration-300 hover:bg-brand hover:text-white md:p-5 motion-reduce:transition-none"
          >
            <dt className="text-sm text-muted transition-colors duration-300 group-hover:text-tint md:text-base motion-reduce:transition-none">
              {shortLabel ? (
                <>
                  <span className="md:hidden">{shortLabel}</span>
                  <span className="hidden md:inline">{label}</span>
                </>
              ) : (
                label
              )}
            </dt>
            <dd className="font-display text-4xl leading-[1.05] transition-colors duration-300 group-hover:text-accent md:text-5xl motion-reduce:transition-none">
              {settingKey ? setting(settings, settingKey, value) : value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
