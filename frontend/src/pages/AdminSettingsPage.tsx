import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { fetchSettings, saveSettings, type Settings } from '@/features/admin/api'
import { Panel } from '@/features/admin/components/Panel'
import { SETTING_SECTIONS } from '@/features/admin/settings'
import { RejectedError, ServiceUnavailableError } from '@/lib/errors'

type Load = 'loading' | 'ready' | 'unavailable'
type Outcome = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'failed'; message: string }

export default function AdminSettingsPage() {
  const [load, setLoad] = useState<Load>('loading')
  const [values, setValues] = useState<Settings>({})
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })

  useEffect(() => {
    let cancelled = false
    fetchSettings().then(
      (data) => {
        if (cancelled) return
        setValues(data)
        setLoad('ready')
      },
      () => {
        if (!cancelled) setLoad('unavailable')
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setOutcome({ kind: 'saving' })
    try {
      await saveSettings(values)
      setOutcome({ kind: 'saved' })
    } catch (error) {
      if (error instanceof RejectedError) setOutcome({ kind: 'failed', message: error.message })
      else if (error instanceof ServiceUnavailableError)
        setOutcome({ kind: 'failed', message: 'Belum tersimpan karena server tidak bisa dihubungi. Coba lagi nanti.' })
      else throw error
    }
  }

  return (
    <>
      <h1 className="mb-5 text-[32px] leading-[1.2] lg:mb-6 lg:text-[40px]">Pengaturan situs</h1>

      {load === 'unavailable' ? (
        <p role="status" className="mb-5 border-l-4 border-brand bg-surface p-3.5 text-[15px]">
          Pengaturan belum terhubung ke server, jadi isian belum bisa dimuat.
        </p>
      ) : null}

      {load === 'loading' ? <p className="text-muted">Memuat…</p> : null}

      {load === 'ready' ? (
        <form noValidate onSubmit={handleSubmit} className="grid max-w-3xl gap-3 lg:gap-5">
          {SETTING_SECTIONS.map((section) => (
            <Panel key={section.title} title={section.title}>
              <div className="grid gap-4">
                {section.fields.map((field) => (
                  <TextField
                    key={field.key}
                    label={field.label}
                    hint={field.hint}
                    multiline={field.kind === 'textarea'}
                    rows={field.kind === 'textarea' ? 4 : undefined}
                    value={values[field.key] ?? ''}
                    onChange={(event) => {
                      setValues({ ...values, [field.key]: event.target.value })
                      setOutcome({ kind: 'idle' })
                    }}
                  />
                ))}
              </div>
            </Panel>
          ))}

          <div aria-live="polite">
            {outcome.kind === 'saved' ? (
              <p className="border-l-4 border-brand bg-surface p-3.5 text-[15px]">Pengaturan tersimpan.</p>
            ) : null}
            {outcome.kind === 'failed' ? (
              <p className="border-l-4 border-danger bg-surface p-3.5 text-[15px]">{outcome.message}</p>
            ) : null}
          </div>

          <div>
            <Button type="submit" variant="dark" disabled={outcome.kind === 'saving'}>
              {outcome.kind === 'saving' ? 'Menyimpan…' : 'Simpan pengaturan'}
            </Button>
          </div>
        </form>
      ) : null}
    </>
  )
}
