'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SettingsPage() {
  const supabase = createClient()
  const [tax, setTax] = useState('1.1383')
  const [tz, setTz] = useState('America/Sao_Paulo')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({ name: '', email: '', avatar: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('settings').select('meta_tax_multiplier,timezone').eq('user_id', user.id).single(),
      supabase.from('profiles').select('full_name,email,avatar_url').eq('id', user.id).single(),
    ])
    if (s) { setTax(String(s.meta_tax_multiplier)); setTz(s.timezone) }
    if (p) setProfile({ name: p.full_name ?? '', email: p.email ?? '', avatar: p.avatar_url ?? '' })
  }

  async function save() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('settings').update({ meta_tax_multiplier: parseFloat(tax), timezone: tz }).eq('user_id', user!.id)
    if (error) toast.error(error.message)
    else toast.success('Configurações salvas!')
    setLoading(false)
  }

  const taxPct = ((parseFloat(tax || '1') - 1) * 100).toFixed(2)

  return (
    <div style={{ maxWidth:620 }}>
      <div style={{ marginBottom:28 }}>
        <h1 className="display" style={{ fontWeight:800, fontSize:24, letterSpacing:'-0.02em' }}>Configurações</h1>
        <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Personalize os parâmetros do sistema</p>
      </div>

      {/* Perfil */}
      <div className="card" style={{ padding:24, marginBottom:18 }}>
        <h2 style={{ fontSize:14, fontWeight:700, marginBottom:18 }}>Conta</h2>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {profile.avatar ? (
            <img src={profile.avatar} alt="" style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover' }} />
          ) : (
            <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--brand-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'var(--brand)' }}>
              {profile.name.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>{profile.name}</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>{profile.email}</div>
          </div>
        </div>
      </div>

      {/* Cálculos */}
      <div className="card" style={{ padding:24, marginBottom:18 }}>
        <h2 style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Cálculos financeiros</h2>
        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>Afeta todos os cálculos de investimento e ROI</p>
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:4 }}>Multiplicador de imposto Meta</label>
            <p style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>
              Gasto × multiplicador = custo real com impostos. Padrão: 1.1383 ({taxPct}% de imposto)
            </p>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input className="input" type="number" step="0.0001" min="1" max="2" value={tax} onChange={e => setTax(e.target.value)} style={{ maxWidth:160 }} />
              <span style={{ fontSize:13, color:'var(--muted)' }}>= {taxPct}% de imposto</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:8 }}>Fuso horário</label>
            <select className="input" value={tz} onChange={e => setTz(e.target.value)} style={{ maxWidth:280 }}>
              <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
              <option value="America/Manaus">Manaus (UTC-4)</option>
              <option value="America/Fortaleza">Fortaleza (UTC-3)</option>
              <option value="America/Belem">Belém (UTC-3)</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={loading} style={{ marginTop:20 }}>
          {loading ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>

      {/* Sistema */}
      <div className="card" style={{ padding:24 }}>
        <h2 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Sobre o AlphaNexus</h2>
        {[
          { k:'Versão', v:'2.0.0' },
          { k:'Stack', v:'Next.js 15 + Supabase + Vercel' },
          { k:'Banco', v:'PostgreSQL (Supabase)' },
          { k:'Auth', v:'Supabase Auth (Google OAuth)' },
          { k:'Webhook', v:'STATUS_ALTERADO + TRACKING_*' },
          { k:'Meta Ads', v:'OAuth oficial v19.0' },
        ].map(r => (
          <div key={r.k} style={{ display:'flex', gap:12, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize:12, color:'var(--dim)', minWidth:120 }}>{r.k}</span>
            <span style={{ fontSize:13 }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
