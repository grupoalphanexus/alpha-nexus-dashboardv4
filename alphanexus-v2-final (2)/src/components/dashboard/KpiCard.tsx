'use client'
import { useState } from 'react'

interface KpiCardProps {
  title: string
  value: string
  sub?: string
  tooltip?: string
  icon?: string
  color?: string
  loading?: boolean
  highlight?: 'positive' | 'negative' | 'neutral'
}

export default function KpiCard({ title, value, sub, tooltip, icon, color = 'var(--brand)', loading, highlight }: KpiCardProps) {
  const [tip, setTip] = useState(false)

  const valueColor = highlight === 'positive' ? 'var(--success)'
    : highlight === 'negative' ? 'var(--danger)'
    : 'var(--text)'

  return (
    <div className="card fade-up" style={{ padding:'18px 22px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:`radial-gradient(circle, ${color}15 0%, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ color:'var(--muted)', fontSize:12.5, fontWeight:500 }}>{title}</span>
          {tooltip && (
            <div style={{ position:'relative' }}>
              <button
                onMouseEnter={() => setTip(true)}
                onMouseLeave={() => setTip(false)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim)', padding:0, lineHeight:1, display:'flex' }}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
              {tip && (
                <div style={{ position:'absolute', bottom:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)', background:'#0c0e18', border:'1px solid var(--border2)', borderRadius:10, padding:'10px 13px', width:210, zIndex:100, fontSize:12, color:'var(--muted)', lineHeight:1.7, boxShadow:'0 8px 28px rgba(0,0,0,0.5)', whiteSpace:'pre-line' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</div>
                  {tooltip}
                  <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'5px solid var(--border2)' }} />
                </div>
              )}
            </div>
          )}
        </div>
        {icon && <span style={{ fontSize:20 }}>{icon}</span>}
      </div>

      {loading ? (
        <div className="shimmer" style={{ height:32, marginBottom:8 }} />
      ) : (
        <div className="metric" style={{ fontSize:26, color: valueColor, marginBottom:5 }}>{value}</div>
      )}

      {sub && <div style={{ color:'var(--dim)', fontSize:12 }}>{sub}</div>}
    </div>
  )
}
