import { PhotoSlot } from '@/components/ui/PhotoSlot'
import { KeyValueList } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { paragraphsOf, useSettings } from '@/lib/siteData'
import { HISTORY_PHOTO, HISTORY_STATEMENT, HISTORY_TIMELINE } from '../content'

/** Paragraf pertama dari pengaturan situs tampil besar; paragraf berikutnya di bawah foto. */
export function HistorySection() {
  const settings = useSettings()
  const written = paragraphsOf(settings['school.history'])
  const [statement = HISTORY_STATEMENT, ...more] = written

  return (
    <Section title="Sejarah" id="sejarah">
      <p className="mb-5 font-display text-xl leading-[1.35] md:mb-7 md:text-[32px] md:leading-[1.3]">
        {statement}
      </p>
      <div className="relative mr-3 mb-2 md:mr-4">
        {/* Bingkai kuning bergeser di belakang foto. */}
        <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 bg-accent md:translate-x-4 md:translate-y-4" />
        <PhotoSlot
          photo={HISTORY_PHOTO}
          placeholder="[Foto dokumentasi sekolah]"
          seed={1}
          className="relative h-50 border-2 border-ink md:h-75"
        />
      </div>
      {more.length > 0 ? (
        <div className="mt-8 space-y-4 text-muted md:text-lg">
          {more.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {/* Garis waktu masih berisi placeholder; disembunyikan begitu sejarah asli diisi admin. */}
      {written.length === 0 ? <KeyValueList items={HISTORY_TIMELINE} className="mt-6 hidden md:block" /> : null}
    </Section>
  )
}
