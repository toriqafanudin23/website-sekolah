import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { ROUTES } from '@/config/navigation'
import { PPDB } from '@/config/site'

/** Banner kuning ajakan mendaftar PPDB. */
export function RegistrationCta() {
  return (
    <section className="relative overflow-hidden bg-accent text-ink">
      {/* Hiasan: bingkai tebal navy transparan di sudut kanan. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 size-56 rotate-12 border-[28px] border-ink/10 md:-top-24 md:-right-10 md:size-96 md:border-[44px]"
      />

      <Container className="relative flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between md:gap-8 md:py-20">
        <Reveal effect="left" as="div" className="md:max-w-175">
          <h2 className="text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.12]">
            Pendaftaran {PPDB.year} dibuka {PPDB.period}.
          </h2>
        </Reveal>
        <Reveal effect="right" index={1}>
          <Button to={ROUTES.admission} variant="dark" withArrow className="md:shrink-0">
            Mulai daftar
          </Button>
        </Reveal>
      </Container>
    </section>
  )
}
