import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends Omit<ComponentProps<'select'>, 'id'> {
  label: string
  options: readonly SelectOption[]
  hint?: string
  error?: string
  /** Teks pilihan kosong, mis. "Pilih jalur". */
  placeholder?: string
}

/** Pilihan tunggal dengan label terlihat, petunjuk, dan pesan galat; tampilannya sama dengan `TextField`. */
export function SelectField({ label, options, hint, error, placeholder = 'Pilih…', className, ...rest }: SelectFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-bold">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'block h-12 w-full border-2 bg-white px-3.5 text-base text-ink md:text-[17px]',
          error ? 'border-danger' : 'border-ink',
          className,
        )}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-bold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
