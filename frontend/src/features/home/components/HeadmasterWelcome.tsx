import { Button } from '@/components/ui/Button'
import { PhotoSlot } from '@/components/ui/PhotoSlot'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { ROUTES } from '@/config/navigation'
import { paragraphsOf, setting, useSettings } from '@/lib/siteData'
import { HEADMASTER, HEADMASTER_PHOTO, HEADMASTER_WELCOME } from '../content'

/** Sambutan kepala sekolah, tepat di bawah hero. Ponsel: foto lalu teks. Desktop: foto di kiri. */
export function HeadmasterWelcome() {
  const settings = useSettings()
  const written = paragraphsOf(settings['headmaster.welcome'])
  const [opening, ...rest] = written.length > 0 ? written : HEADMASTER_WELCOME

  return (
    <Section title="Sambutan kepala sekolah" id="sambutan" reveal={false}>
      <div className="md:grid md:grid-cols-[15rem_1fr] md:gap-12">
        <Reveal as="figure" effect="zoom">
          <div className="relative mr-3 max-w-60 md:mr-0">
            {/* Kotak kuning bergeser di belakang foto. */}
            <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 bg-accent" />
            <PhotoSlot
              photo={HEADMASTER_PHOTO}
              placeholder="[Foto Kepala Sekolah]"
              seed={2}
              className="relative h-72 w-full border-2 border-ink md:h-80"
            />
          </div>
          <figcaption className="mt-5">
            <strong className="block">{setting(settings, 'headmaster.name', HEADMASTER.name)}</strong>
            <span className="text-sm text-muted md:text-base">{HEADMASTER.role}</span>
          </figcaption>
        </Reveal>

        <div className="mt-8 md:mt-0">
          <Reveal as="p" index={1} className="font-display text-2xl leading-[1.35] md:text-[32px] md:leading-[1.3]">
            {opening}
          </Reveal>
          <div className="mt-5 space-y-4 text-muted md:mt-6 md:text-lg">
            {rest.map((paragraph, index) => (
              <Reveal as="p" key={paragraph} index={index + 2}>
                {paragraph}
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-6 md:mt-8" index={rest.length + 2}>
            <Button to={ROUTES.profile} variant="outlineDark" withArrow>
              Kenali sekolah kami
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
