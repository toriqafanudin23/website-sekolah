import { useState } from 'react'
import { FilterChips } from '@/components/ui/FilterChips'
import { Section } from '@/components/ui/Section'
import { useRemote } from '@/lib/publicApi'
import type { ApiScheduleEntry } from '../api'
import { CLASS_OPTIONS, type ClassGrade } from '../content'

/** Indeks 0 = Senin, sesuai `weekday` 1 sampai 6 dari API. */
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

const byStartTime = (a: ApiScheduleEntry, b: ApiScheduleEntry) => a.startTime.localeCompare(b.startTime)

function DaySchedule({ day, rows }: { day: string; rows: readonly ApiScheduleEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-72 border-collapse text-left">
        <caption className="mb-1.5 text-left font-display text-xl md:text-2xl">{day}</caption>
        <thead>
          <tr className="border-y-2 border-ink text-sm">
            <th scope="col" className="w-28 py-2 pr-3 font-bold">
              Jam
            </th>
            <th scope="col" className="py-2 pr-3 font-bold">
              Mata pelajaran
            </th>
            <th scope="col" className="py-2 font-bold">
              Guru
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line align-top">
              <td className="py-2.5 pr-3 whitespace-nowrap">
                {row.startTime} sampai {row.endTime}
              </td>
              <td className="py-2.5 pr-3 font-bold">{row.subject}</td>
              <td className="py-2.5 text-muted">{row.teacher || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Jadwal per kelas. Seluruh jadwal diminta sekali, lalu disaring di browser saat kelas diganti
 * (tanpa permintaan baru). Bila API belum aktif, tampil kotak sementara seperti desain awal.
 */
export function ScheduleSection() {
  const [grade, setGrade] = useState<ClassGrade>('1')
  const remote = useRemote<ApiScheduleEntry[]>('/public/schedules')

  const rows = remote.kind === 'ready' ? remote.data.filter((entry) => String(entry.grade) === grade) : []
  const days = DAYS.map((day, index) => ({
    day,
    rows: rows.filter((entry) => entry.weekday === index + 1).toSorted(byStartTime),
  })).filter((group) => group.rows.length > 0)

  return (
    <Section title="Jadwal pelajaran" id="jadwal">
      <FilterChips options={CLASS_OPTIONS} value={grade} onChange={setGrade} label="Pilih kelas" />

      <div aria-live="polite" className="mt-5">
        {remote.kind === 'loading' ? <p className="text-muted">Memuat jadwal…</p> : null}

        {remote.kind === 'unavailable' ? (
          <div
            role="status"
            className="flex h-45 items-center justify-center border-2 border-dashed border-placeholder-line bg-surface p-4 text-center text-sm text-muted md:h-50"
          >
            [Jadwal pelajaran kelas {grade}]
          </div>
        ) : null}

        {remote.kind === 'ready' && days.length === 0 ? (
          <p className="text-muted">Jadwal kelas {grade} belum diisi.</p>
        ) : null}

        {days.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2">
            {days.map(({ day, rows: dayRows }) => (
              <DaySchedule key={day} day={day} rows={dayRows} />
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  )
}
