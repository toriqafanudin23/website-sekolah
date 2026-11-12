import { useState } from 'react'
import { FilterChips } from '@/components/ui/FilterChips'
import { PhotoSlot } from '@/components/ui/PhotoSlot'
import { Section } from '@/components/ui/Section'
import { staffFromApi, type ApiStaffMember } from '@/features/information/api'
import { remoteOr, useRemote } from '@/lib/publicApi'
import { STAFF, STAFF_FILTERS, type StaffFilter } from '../content'
import type { StaffMember } from '../types'

/** Guru dan tenaga kependidikan, dengan filter kategori. Kepala sekolah hanya muncul di "Semua". */
export function StaffSection() {
  const [filter, setFilter] = useState<StaffFilter>('semua')
  const remote = useRemote<ApiStaffMember[]>('/public/staff')
  const all = remoteOr<ApiStaffMember[], readonly StaffMember[]>(remote, (items) => items.map(staffFromApi), STAFF)
  const members = !all ? [] : filter === 'semua' ? all : all.filter(({ category }) => category === filter)

  return (
    <Section title="Guru dan tendik" id="guru-tendik">
      <FilterChips options={STAFF_FILTERS} value={filter} onChange={setFilter} label="Filter kategori" />

      {!all ? (
        <p role="status" className="mt-5 text-muted">
          Memuat data…
        </p>
      ) : members.length === 0 ? (
        <p className="mt-5 text-muted">Belum ada data untuk kategori ini.</p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {members.map(({ id, name, role, photo }, index) => (
            <li key={id} className="group/card">
              <PhotoSlot photo={photo} placeholder="[Foto]" seed={index} className="h-37.5 md:h-55" />
              <strong className="mt-2 block transition-colors duration-200 group-hover/card:text-brand md:mt-2.5">
                {name}
              </strong>
              <span className="text-sm text-muted md:text-base">{role}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
