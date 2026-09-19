'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Field form permukaan publik (order wizard, auth) — label + input + error/hint,
// fokus ring forest. Pengganti INPUT_CLS/LABEL_CLS lokal & Input.tsx legacy (rose).

const INPUT_BASE = cn(
  'w-full px-4 py-3 text-body-base text-graphite placeholder:text-ash bg-chalk',
  'border border-hairline rounded-input transition-colors',
  'focus:outline-none focus:border-forest-light focus:ring-2 focus:ring-forest/15',
)

interface FieldWrapProps {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
}

function FieldWrap({ label, error, hint, children }: FieldWrapProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-label-base text-carbon">{label}</label>}
      {children}
      {error && <p className="text-body-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-body-xs text-concrete">{hint}</p>}
    </div>
  )
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <FieldWrap label={label} error={error} hint={hint}>
      <input ref={ref} className={cn(INPUT_BASE, error && 'border-red-400', className)} {...props} />
    </FieldWrap>
  ),
)
InputField.displayName = 'InputField'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  labelAction?: React.ReactNode
}

/** Input password dengan toggle lihat/sembunyikan yang bisa diakses keyboard. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, hint, labelAction, className, ...props }, ref) => {
    const [show, setShow] = useState(false)
    return (
      <div className="space-y-1.5">
        {(label || labelAction) && (
          <div className="flex items-center justify-between">
            {label && <label className="block text-label-base text-carbon">{label}</label>}
            {labelAction}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={show ? 'text' : 'password'}
            className={cn(INPUT_BASE, 'pr-10', error && 'border-red-400', className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
            // Area sentuh 44x44 lewat padding negatif: ikonnya tetap kecil,
            // yang membesar hanya wilayah yang bisa ditekan jempol (R-03).
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-concrete hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded"
          >
            <EyeIcon open={show} />
          </button>
        </div>
        {error && <p className="text-body-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-body-xs text-concrete">{hint}</p>}
      </div>
    )
  },
)
PasswordField.displayName = 'PasswordField'

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, className, rows = 4, ...props }, ref) => (
    <FieldWrap label={label} error={error} hint={hint}>
      <textarea
        ref={ref}
        rows={rows}
        className={cn(INPUT_BASE, 'resize-none', error && 'border-red-400', className)}
        {...props}
      />
    </FieldWrap>
  ),
)
TextareaField.displayName = 'TextareaField'
