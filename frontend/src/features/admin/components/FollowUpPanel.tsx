import { Link } from 'react-router'
import { ADMIN_ROUTES } from '@/config/navigation'
import type { DashboardData } from '../api'
import { Panel } from './Panel'

interface FollowUp {
  label: string
  action: string
  to: string
  count: (data: DashboardData) => number
}

const FOLLOW_UPS: readonly FollowUp[] = [
  {
    label: 'Berkas PPDB menunggu verifikasi',
    action: 'Periksa',
    to: ADMIN_ROUTES.admission,
    count: (d) => d.followUps.pendingFiles,
  },
  {
    label: 'Pesan belum dibaca',
    action: 'Baca',
    to: ADMIN_ROUTES.messages,
    count: (d) => d.newMessages,
  },
  {
    label: 'Berita masih berstatus draf',
    action: 'Lanjutkan',
    to: ADMIN_ROUTES.news,
    count: (d) => d.followUps.draftNews,
  },
  {
    label: 'Agenda belum bertanggal',
    action: 'Lengkapi',
    to: ADMIN_ROUTES.agenda,
    count: (d) => d.followUps.undatedAgenda,
  },
]

/** Daftar pekerjaan tertunda. Dengan data, baris yang sudah beres disembunyikan. */
export function FollowUpPanel({ data, hideAdmission = false }: { data: DashboardData | undefined; hideAdmission?: boolean }) {
  // Editor tidak boleh membuka PPDB, jadi tindak lanjut ke sana disembunyikan.
  const visible = hideAdmission ? FOLLOW_UPS.filter(({ to }) => to !== ADMIN_ROUTES.admission) : FOLLOW_UPS
  const rows = data ? visible.filter((item) => item.count(data) > 0) : visible

  return (
    <Panel title="Perlu ditindaklanjuti">
      {rows.length === 0 ? (
        <p className="border-t border-line pt-4 text-muted">Semua sudah beres. Tidak ada yang perlu ditindaklanjuti.</p>
      ) : (
        <ul>
          {rows.map(({ label, action, to }) => (
            <li key={label} className="flex items-center justify-between gap-4 border-t border-line py-4">
              <span>{label}</span>
              <Link to={to} className="font-bold underline underline-offset-4 hover:no-underline">
                {action}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
