import { Section } from '@/components/ui/Section'
import { remoteOr, useRemote } from '@/lib/publicApi'
import type { ApiDownload } from '../api'
import { DOWNLOADS } from '../content'
import type { DownloadFile } from '../types'

const fromApi = (items: ApiDownload[]): readonly DownloadFile[] => items.map(({ name, href }) => ({ name, href }))

export function DownloadsSection() {
  const remote = useRemote<ApiDownload[]>('/public/downloads')
  const files = remoteOr(remote, fromApi, DOWNLOADS)

  return (
    <Section title="Unduhan" id="unduhan">
      {!files ? (
        <p role="status" className="text-muted">
          Memuat berkas…
        </p>
      ) : files.length === 0 ? (
        <p className="text-muted">Belum ada berkas untuk diunduh.</p>
      ) : (
        <ul>
          {files.map(({ name, href }) => (
            <li key={`${name}-${href}`} className="flex justify-between gap-4 border-t border-line py-3.5 md:gap-6 md:py-4">
              <span>{name}</span>
              <a href={href} download className="font-bold underline-offset-4 hover:underline">
                Unduh<span className="hidden md:inline"> [PDF]</span>
                <span className="sr-only"> {name}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
