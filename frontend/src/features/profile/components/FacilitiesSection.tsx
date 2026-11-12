import type { LucideIcon } from 'lucide-react'
import { IconTile } from '@/components/ui/IconTile'
import { PhotoSlot, type PhotoSource } from '@/components/ui/PhotoSlot'
import { Section } from '@/components/ui/Section'
import { FACILITY_GROUPS } from '../content'

interface FacilityPhotoProps {
  name: string
  photo: PhotoSource
  icon: LucideIcon
}

/**
 * Foto 4:3 dengan ikon di sudut. Selama berkas foto sekolah di `public/fasilitas/` belum ada,
 * `PhotoSlot` memakai foto sementara secara otomatis.
 */
function FacilityPhoto({ name, photo, icon }: FacilityPhotoProps) {
  return (
    <div className="relative">
      <PhotoSlot photo={photo} placeholder={name} seed={name} className="aspect-[4/3] w-full" />
      <IconTile
        icon={icon}
        className="absolute bottom-0 left-0 size-9 group-hover/card:bg-ink group-hover/card:text-accent md:size-10"
      />
    </div>
  )
}

/** Sarana dan prasarana: dua kelompok, tiap item berupa kartu foto dengan nama dan keterangan. */
export function FacilitiesSection() {
  return (
    <Section title="Sarana dan prasarana" id="fasilitas">
      <div className="space-y-8 md:space-y-10">
        {FACILITY_GROUPS.map(({ title, items }) => (
          <div key={title}>
            <h3 className="mb-4 text-xl md:text-2xl">{title}</h3>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-5 md:gap-y-8">
              {items.map(({ name, description, icon, photo }) => (
                <li key={name} className="group/card">
                  <FacilityPhoto name={name} photo={photo} icon={icon} />
                  <strong className="mt-2 block leading-snug transition-colors duration-200 group-hover/card:text-brand md:mt-2.5">
                    {name}
                  </strong>
                  <span className="text-sm text-muted md:text-base">{description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
