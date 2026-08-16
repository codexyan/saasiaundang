'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

/**
 * Pembungkus pola fetch yang berulang ~145 kali di seluruh komponen:
 *
 *   setLoading(true)
 *   try {
 *     const res = await fetch(url, { method, headers, body: JSON.stringify(x) })
 *     if (!res.ok) { const e = await res.json(); toast.error(e.error || '...'); return }
 *     toast.success('...')
 *   } finally { setLoading(false) }
 *
 * Dipakai untuk KODE BARU. Migrasi kode lama sengaja organik — dilakukan saat
 * file itu memang sedang disentuh untuk alasan lain, bukan sekali-jalan ke 145
 * lokasi sekaligus (diff sebesar itu tidak bisa diverifikasi tanpa klik UI).
 *
 * Catatan pemakaian: kalau komponen sudah punya state loading sendiri yang
 * menggerakkan UI (mis. spinner satu tombol tertentu), PERTAHANKAN state itu
 * dan abaikan `loading` dari hook. Satu instance hook yang dipakai beberapa
 * aksi membuat `loading`-nya menyala untuk SEMUA aksi itu — tombol "Tambah"
 * ikut berputar saat baris lain dihapus.
 */

const FALLBACK_ERROR = 'Ada kendala sebentar. Coba lagi ya.'

interface MutateOptions {
  method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Objek biasa di-JSON.stringify otomatis; FormData diteruskan apa adanya. */
  body?: unknown
  /** Ditampilkan sebagai toast sukses. Kosongkan kalau tidak perlu toast. */
  successMessage?: string
  /** Dipakai HANYA kalau server tidak mengirim field `error`. */
  errorMessage?: string
  /** Matikan seluruh toast — untuk aksi latar yang tidak perlu diketahui user. */
  silent?: boolean
}

/**
 * Mengembalikan body JSON kalau berhasil, atau `null` kalau gagal (toast error
 * sudah ditampilkan). Jadi pemanggil cukup: `if (!data) return`.
 */
export function useApiMutation<T = unknown>() {
  const [loading, setLoading] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    // Di-set true di badan efek, bukan hanya di cleanup: StrictMode React 18
    // menjalankan efek dua kali saat dev, dan tanpa ini instance-nya sudah
    // terlanjur dianggap mati sebelum dipakai.
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const mutate = useCallback(async (url: string, opts: MutateOptions = {}): Promise<T | null> => {
    const { method = 'POST', body, successMessage, errorMessage, silent } = opts
    setLoading(true)
    try {
      const isForm = typeof FormData !== 'undefined' && body instanceof FormData
      const res = await fetch(url, {
        method,
        ...(body !== undefined && !isForm ? { headers: { 'Content-Type': 'application/json' } } : {}),
        ...(body !== undefined ? { body: (isForm ? body : JSON.stringify(body)) as BodyInit } : {}),
      })

      // Sebagian endpoint membalas 204 atau body kosong; jangan sampai itu
      // dianggap gagal hanya karena tidak bisa di-parse.
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (!silent) toast.error((data as { error?: string } | null)?.error || errorMessage || FALLBACK_ERROR)
        return null
      }
      if (successMessage && !silent) toast.success(successMessage)
      return (data ?? ({} as T)) as T
    } catch {
      if (!silent) toast.error(errorMessage || FALLBACK_ERROR)
      return null
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [])

  return { mutate, loading }
}

interface QueryOptions {
  /** Kosongkan untuk membiarkan kegagalan senyap (mis. data pelengkap). */
  errorMessage?: string
  /** `false` menunda pengambilan — berguna kalau parameternya belum siap. */
  enabled?: boolean
}

/**
 * GET + loading + data, dengan penjaga balapan: hanya respons dari permintaan
 * TERAKHIR yang boleh menulis state. Tanpa itu, dua permintaan beruntun bisa
 * selesai terbalik dan yang tampil justru data lama.
 */
export function useApiQuery<T = unknown>(url: string | null, opts: QueryOptions = {}) {
  const { errorMessage, enabled = true } = opts
  const active = enabled && !!url

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(active)
  const requestId = useRef(0)

  const refetch = useCallback(async () => {
    if (!url || !enabled) return
    const id = ++requestId.current
    setLoading(true)
    try {
      const res = await fetch(url)
      const json = await res.json().catch(() => null)
      if (id !== requestId.current) return // sudah ada permintaan yang lebih baru
      if (!res.ok) {
        if (errorMessage) toast.error((json as { error?: string } | null)?.error || errorMessage)
        return
      }
      setData(json as T)
    } catch {
      if (id === requestId.current && errorMessage) toast.error(errorMessage)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [url, enabled, errorMessage])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, refetch, setData }
}
