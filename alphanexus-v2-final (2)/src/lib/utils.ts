import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DatePreset, DateRange } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(dateStr: string, fmt = 'dd/MM/yyyy'): string {
  try {
    return format(new Date(dateStr), fmt, { locale: ptBR })
  } catch { return dateStr }
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, 'dd/MM')
}

export function getDateRange(preset: DatePreset, custom?: DateRange): { from: string; to: string } {
  const today = new Date()
  if (preset === 'custom' && custom) {
    return {
      from: format(startOfDay(custom.from), 'yyyy-MM-dd'),
      to: format(endOfDay(custom.to), 'yyyy-MM-dd'),
    }
  }
  const days = preset === 'hoje' ? 0 : preset === '7d' ? 7 : preset === '14d' ? 14 : 30
  return {
    from: format(subDays(today, days), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  }
}

export function calcROI(commission: number, spend: number): number {
  return spend > 0 ? commission / spend : 0
}

export function calcCAC(spend: number, sales: number): number {
  return sales > 0 ? spend / sales : 0
}

export function calcFrustrationRate(frustrated: number, total: number): number {
  return total > 0 ? (frustrated / total) * 100 : 0
}

export function getROIColor(roi: number): string {
  if (roi >= 3) return 'text-emerald-400'
  if (roi >= 1.5) return 'text-amber-400'
  return 'text-red-400'
}

export function getFrustrationColor(rate: number): string {
  if (rate <= 15) return 'text-emerald-400'
  if (rate <= 30) return 'text-amber-400'
  return 'text-red-400'
}

export function getCampaignScore(roi: number, frustRate: number): {
  label: string; color: string; bg: string
} {
  if (roi >= 2.5 && frustRate <= 20) return { label: 'Escalar 🟢', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
  if (roi >= 1.2 || frustRate <= 35) return { label: 'Testar 🟡', color: 'text-amber-400', bg: 'bg-amber-400/10' }
  return { label: 'Pausar 🔴', color: 'text-red-400', bg: 'bg-red-400/10' }
}

export function centsToBRL(cents: number): number {
  return cents / 100
}

export function presetLabel(preset: DatePreset): string {
  const map: Record<DatePreset, string> = {
    hoje: 'Hoje', '7d': '7 dias', '14d': '14 dias', '30d': '30 dias', custom: 'Personalizado'
  }
  return map[preset]
}
