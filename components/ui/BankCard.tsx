'use client'

import { Copy, Check, Wifi } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const BANK_GRADIENTS: Record<string, { from: string; to: string }> = {
  bca:        { from: '#003D79', to: '#0060B9' },
  bni:        { from: '#E04E1B', to: '#F05A28' },
  bri:        { from: '#003A78', to: '#00529C' },
  mandiri:    { from: '#002B5B', to: '#003D79' },
  bsi:        { from: '#007A3D', to: '#00A652' },
  'cimb niaga': { from: '#5E1530', to: '#7B1D3E' },
  permata:    { from: '#007A3D', to: '#00A551' },
  danamon:    { from: '#003D6A', to: '#005B99' },
  'ocbc nisp': { from: '#B5161A', to: '#DE1C24' },
  jago:       { from: '#009AD6', to: '#00C8FF' },
  seabank:    { from: '#1F8080', to: '#2AA0A0' },
  gopay:      { from: '#00AADC', to: '#00D4FF' },
  ovo:        { from: '#4C2A86', to: '#6B3FA0' },
  dana:       { from: '#108BE2', to: '#3DA5F4' },
}

function getGradient(bankName: string): { from: string; to: string } {
  const key = Object.keys(BANK_GRADIENTS).find(k => bankName.toLowerCase().includes(k))
  return key ? BANK_GRADIENTS[key] : { from: '#4338CA', to: '#6366F1' }
}

function maskNumber(num: string): string {
  if (num.length <= 4) return num
  const last4 = num.slice(-4)
  const rest = num.slice(0, -4)
  const masked = rest.replace(/./g, '•')
  const groups: string[] = []
  for (let i = 0; i < masked.length; i += 4) {
    groups.push(masked.slice(i, i + 4))
  }
  return groups.join('  ') + '  ' + last4
}

interface BankCardProps {
  bankName: string
  accountNumber: string
  accountName: string
  selected?: boolean
  selectable?: boolean
  showCopy?: boolean
  onClick?: () => void
}

export default function BankCard({
  bankName, accountNumber, accountName,
  selected, selectable, showCopy, onClick,
}: BankCardProps) {
  const [copied, setCopied] = useState(false)
  const g = getGradient(bankName)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(accountNumber)
    setCopied(true)
    toast.success('Nomor rekening sudah disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  const ring = selected ? 'ring-2 ring-white ring-offset-2 ring-offset-forest-500' : ''

  return (
    <div
      onClick={onClick}
      className={`relative aspect-[8/5] rounded-2xl overflow-hidden text-white transition-all ${
        selectable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${ring} ${selected ? 'shadow-xl' : 'shadow-lg'}`}
      style={{ background: `linear-gradient(135deg, ${g.from} 0%, ${g.to} 100%)` }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-[0.07]" style={{ backgroundColor: '#fff' }} />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full opacity-[0.05]" style={{ backgroundColor: '#fff' }} />

      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-5">
        {/* Top row: bank name + chip */}
        <div className="flex items-center justify-between">
          <p className="font-bold tracking-tight text-sm">{bankName}</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded-[3px] bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-inner">
              <div className="w-5 h-3.5 rounded-[2px] border border-yellow-600/30 bg-gradient-to-br from-yellow-200/50 to-yellow-500/50" />
            </div>
            <Wifi size={14} className="text-white/50 rotate-90" />
          </div>
        </div>

        {/* Account number */}
        <div>
          <p className="font-mono tracking-[0.15em] text-white/90 text-sm sm:text-base">
            {maskNumber(accountNumber)}
          </p>
        </div>

        {/* Bottom row: name + copy */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-medium mb-0.5">Atas Nama</p>
            <p className="font-semibold text-white/90 truncate text-xs sm:text-sm">{accountName}</p>
          </div>
          {showCopy && (
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1 text-[10px] text-white/50 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors backdrop-blur-sm"
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Disalin' : 'Salin'}
            </button>
          )}
          {selectable && (
            <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selected ? 'border-white bg-white' : 'border-white/40'
            }`}>
              {selected && <Check size={10} className="text-indigo-700" strokeWidth={3} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function QrisCard({
  imageUrl, selected, selectable, onClick,
}: {
  imageUrl: string
  selected?: boolean
  selectable?: boolean
  onClick?: () => void
}) {
  const ring = selected ? 'ring-2 ring-forest-500 ring-offset-2' : ''
  return (
    <div
      onClick={onClick}
      className={`relative aspect-[8/5] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 text-white transition-all shadow-lg ${
        selectable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${ring}`}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 gap-2">
        <div className="w-20 h-20 rounded-xl bg-white p-1.5 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="QRIS" className="w-full h-full object-contain" />
        </div>
        <p className="text-sm font-bold text-white/90">QRIS</p>
        <p className="text-[10px] text-white/40">Scan untuk bayar</p>
        {selectable && (
          <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            selected ? 'border-white bg-white' : 'border-white/40'
          }`}>
            {selected && <Check size={10} className="text-slate-900" strokeWidth={3} />}
          </div>
        )}
      </div>
    </div>
  )
}
