/** Satu jam pelajaran dari API publik (`GET /public/schedules`). */
export interface ApiScheduleEntry {
  id: string
  /** 1 sampai 6 */
  grade: number
  /** 1 = Senin sampai 6 = Sabtu */
  weekday: number
  /** `HH:MM` */
  startTime: string
  endTime: string
  subject: string
  /** Nama guru pengampu; kosong bila belum diisi. */
  teacher: string
}

/** `GET /public/academic`. */
export interface ApiAcademic {
  extracurriculars: readonly { id: string; name: string; schedule: string; description: string }[]
  calendar: readonly { id: string; label: string; startsOn: string; endsOn: string; semester: string }[]
}
