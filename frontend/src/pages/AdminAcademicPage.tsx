import { useState } from 'react'
import { FilterChips } from '@/components/ui/FilterChips'
import { ResourceManager } from '@/features/admin/components/ResourceManager'
import { RESOURCES } from '@/features/admin/resources'

const ACADEMIC = RESOURCES.filter((def) => def.group === 'akademik')
const TABS = ACADEMIC.map((def) => ({ value: def.key, label: def.title }))

/** Akademik: ekstrakurikuler, jadwal pelajaran, dan kalender akademik sebagai tab dalam satu halaman. */
export default function AdminAcademicPage() {
  const [key, setKey] = useState(ACADEMIC[0].key)
  const def = ACADEMIC.find((item) => item.key === key) ?? ACADEMIC[0]

  return (
    <>
      <h1 className="mb-5 text-[32px] leading-[1.2] lg:mb-6 lg:text-[40px]">Akademik</h1>
      <FilterChips options={TABS} value={key} onChange={setKey} label="Bagian akademik" className="mb-6" />
      <ResourceManager key={def.key} def={def} heading="h2" />
    </>
  )
}
