'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import type { DatePreset, DateRange } from '@/types'
import { presetLabel } from '@/lib/utils'

interface Props {
  preset: DatePreset
  custom: DateRange | undefined
  onPreset: (p: DatePreset) => void
  onCustom: (r: DateRange) => void
}

const PRESETS: DatePreset[] = ['hoje', '7d', '14d', '30d', 'custom']

export default function DateFilter({ preset, custom, onPreset, onCustom }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [fromVal, setFromVal] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [toVal, setToVal] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  function applyCustom() {
    onCustom({ from: new Date(fromVal + 'T00:00:00'), to: new Date(toVal + 'T23:59:59') })
    setShowCustom(false)
    onPreset('custom')
  }

  return (
    <div style={{ position:'relative', display:'flex', gap:6, alignItems:'center' }}>
      <div style={{ display:'flex', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        {PRESETS.map(p => (
          <button key={p} onClick={() => { if (p === 'custom') setShowCustom(v => !v); else { onPreset(p); setShowCustom(false) } }} style={{
            padding:'7px 13px', background: preset === p ? 'var(--brand)' : 'transparent',
            color: preset === p ? 'white' : 'var(--muted)', border:'none', cursor:'pointer',
            fontSize:12.5, fontWeight:600, fontFamily:'inherit', transition:'all 0.15s',
            borderRight: p !== 'custom' ? '1px solid var(--border)' : 'none',
          }}>
            {presetLabel(p)}
          </button>
        ))}
      </div>

      {preset === 'custom' && custom && (
        <span style={{ fontSize:12, color:'var(--muted)', whiteSpace:'nowrap' }}>
          {format(custom.from, 'dd/MM')} – {format(custom.to, 'dd/MM/yy')}
        </span>
      )}

      {showCustom && (
        <div className="card" style={{ position:'absolute', top:'calc(100% + 8px)', right:0, padding:20, zIndex:200, width:260, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          <p style={{ fontSize:12, color:'var(--muted)', marginBottom:12, fontWeight:600 }}>PERÍODO PERSONALIZADO</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:'var(--dim)', display:'block', marginBottom:4 }}>De</label>
              <input type="date" className="input" value={fromVal} onChange={e => setFromVal(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--dim)', display:'block', marginBottom:4 }}>Até</label>
              <input type="date" className="input" value={toVal} onChange={e => setToVal(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <button className="btn btn-primary" onClick={applyCustom} style={{ flex:1, justifyContent:'center' }}>Aplicar</button>
              <button className="btn btn-ghost" onClick={() => setShowCustom(false)} style={{ flex:1, justifyContent:'center' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
