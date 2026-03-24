'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { AdAccount, Webhook } from '@/types'

export default function ConnectPage() {
  const supabase = createClient()
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(false)
  const [editWh, setEditWh] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [newWhName, setNewWhName] = useState('')
  const [newWhType, setNewWhType] = useState<'agendado' | 'antecipado' | 'pago'>('agendado')

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: a }, { data: w }] = await Promise.all([
      supabase.from('ad_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('webhooks').select('*').order('created_at', { ascending: false }),
    ])
    setAdAccounts(a ?? [])
    setWebhooks(w ?? [])

    // Mostrar mensagem de sucesso/erro do OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'meta_connected') toast.success('Meta Ads conectado com sucesso!')
    if (params.get('error')) toast.error('Erro ao conectar Meta Ads. Tente novamente.')
  }

  function connectMeta() {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    if (!appId) { toast.error('META_APP_ID não configurado nas variáveis de ambiente'); return }
    const redirect = encodeURIComponent(`${appUrl}/api/meta/callback`)
    const scope = 'ads_read,read_insights,business_management'
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirect}&scope=${scope}&response_type=code`
    window.location.href = url
  }

  async function syncAccount(id: string) {
    toast.loading('Sincronizando...', { id: 'sync' })
    const res = await fetch('/api/meta/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad_account_id: id }) })
    const d = await res.json() as { error?: string; synced?: number }
    if (d.error) toast.error(d.error, { id: 'sync' })
    else toast.success(`${d.synced ?? 0} insights sincronizados!`, { id: 'sync' })
    await load()
  }

  async function deleteAccount(id: string) {
    if (!confirm('Remover conta?')) return
    await supabase.from('ad_accounts').delete().eq('id', id)
    toast.success('Conta removida')
    await load()
  }

  async function createWebhook() {
    if (!newWhName.trim()) { toast.error('Digite um nome para o webhook'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('webhooks').insert({ user_id: user!.id, name: newWhName, label: newWhName, sale_type: newWhType, active: true })
    if (error) toast.error(error.message)
    else { toast.success('Webhook criado!'); setNewWhName('') }
    setLoading(false)
    await load()
  }

  async function saveWebhookName(id: string) {
    await supabase.from('webhooks').update({ name: editName, label: editName }).eq('id', id)
    toast.success('Nome atualizado!')
    setEditWh(null)
    await load()
  }

  async function toggleWebhook(id: string, active: boolean) {
    await supabase.from('webhooks').update({ active: !active }).eq('id', id)
    await load()
  }

  async function copyUrl(token: string) {
    await navigator.clipboard.writeText(`${appUrl}/api/webhook/braip/${token}`)
    setCopied(token)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(null), 2000)
  }

  const saleTypeLabel: Record<string, string> = { agendado: '📅 Agendado', antecipado: '⚡ Antecipado', pago: '✅ Pago', custom: '🔧 Custom' }

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 className="display" style={{ fontWeight:800, fontSize:24, letterSpacing:'-0.02em' }}>Integrações</h1>
        <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Conecte o Meta Ads e configure seus webhooks da Braip</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        {/* META ADS */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(24,119,242,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700 }}>Meta Ads</h2>
              <p style={{ fontSize:12, color:'var(--muted)' }}>Login via Facebook OAuth</p>
            </div>
          </div>

          <div className="card" style={{ padding:22, marginBottom:14 }}>
            <p style={{ fontSize:13, color:'var(--muted)', marginBottom:16, lineHeight:1.7 }}>
              Clique abaixo para fazer login com sua conta do Facebook. O sistema vai solicitar as permissões necessárias para ler os dados dos seus anúncios automaticamente.
            </p>
            <div style={{ background:'rgba(97,114,243,0.08)', border:'1px solid rgba(97,114,243,0.2)', borderRadius:10, padding:14, marginBottom:16 }}>
              <p style={{ fontSize:12, color:'var(--brand-l)', fontWeight:600, marginBottom:6 }}>Permissões solicitadas:</p>
              <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.8 }}>✓ ads_read — Ler dados de anúncios<br/>✓ read_insights — Ler métricas e insights<br/>✓ business_management — Acessar contas do BM</p>
            </div>
            <button className="btn btn-primary" onClick={connectMeta} style={{ width:'100%', justifyContent:'center', gap:10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Conectar com Facebook
            </button>
          </div>

          {adAccounts.length > 0 && (
            <div className="card" style={{ padding:18 }}>
              <h3 style={{ fontSize:13, fontWeight:600, marginBottom:14, color:'var(--muted)' }}>Contas conectadas</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {adAccounts.map(acc => (
                  <div key={acc.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:'rgba(255,255,255,0.03)', borderRadius:9 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: acc.active ? 'var(--success)' : 'var(--danger)', flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{acc.name ?? acc.account_name ?? acc.meta_account_id}</div>
                      <div style={{ fontSize:11, color:'var(--dim)' }}>
                        ID: {acc.meta_account_id} · {acc.oauth_connected ? '🔗 OAuth' : '🔑 Token'} · {acc.last_sync_at ? formatDate(acc.last_sync_at, 'dd/MM HH:mm') : 'Nunca sincronizado'}
                      </div>
                    </div>
                    <button onClick={() => syncAccount(acc.id)} className="btn btn-ghost" style={{ padding:'5px 11px', fontSize:12 }}>↻ Sync</button>
                    <button onClick={() => deleteAccount(acc.id)} className="btn btn-danger" style={{ padding:'5px 11px', fontSize:12 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BRAIP WEBHOOKS */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--brand-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📡</div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700 }}>Webhooks Braip</h2>
              <p style={{ fontSize:12, color:'var(--muted)' }}>Múltiplos webhooks por tipo de venda</p>
            </div>
          </div>

          <div className="card" style={{ padding:22, marginBottom:14 }}>
            <h3 style={{ fontSize:13, fontWeight:600, marginBottom:14, color:'var(--muted)' }}>Criar novo webhook</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Nome (ex: Agendados Kit 12m)</label>
                <input className="input" placeholder="Nome do webhook" value={newWhName} onChange={e => setNewWhName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Tipo de venda</label>
                <select className="input" value={newWhType} onChange={e => setNewWhType(e.target.value as 'agendado' | 'antecipado' | 'pago')}>
                  <option value="agendado">📅 Agendado</option>
                  <option value="antecipado">⚡ Antecipado</option>
                  <option value="pago">✅ Pago direto</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={createWebhook} disabled={loading} style={{ justifyContent:'center' }}>
                {loading ? 'Criando...' : '+ Criar Webhook'}
              </button>
            </div>
          </div>

          {/* Como conectar */}
          <div className="card" style={{ padding:18, marginBottom:14, borderColor:'rgba(97,114,243,0.25)' }}>
            <p style={{ fontSize:12, fontWeight:700, color:'var(--brand-l)', marginBottom:10 }}>Como conectar na Braip</p>
            {['Crie um webhook acima', 'Copie o link gerado', 'Na Braip: Configurações → Postback', 'Cole o link e ative'].map((s, i) => (
              <div key={i} style={{ display:'flex', gap:9, marginBottom:7, alignItems:'flex-start' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--brand-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--brand)', flexShrink:0 }}>{i+1}</div>
                <span style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Lista de webhooks */}
          {webhooks.length > 0 && (
            <div className="card" style={{ padding:18 }}>
              <h3 style={{ fontSize:13, fontWeight:600, marginBottom:14, color:'var(--muted)' }}>Webhooks ativos</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {webhooks.map(wh => (
                  <div key={wh.id} style={{ padding:14, background:'rgba(255,255,255,0.03)', borderRadius:9, border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background: wh.active ? 'var(--success)' : 'var(--danger)' }} />
                        {editWh === wh.id ? (
                          <div style={{ display:'flex', gap:6 }}>
                            <input className="input" value={editName} onChange={e => setEditName(e.target.value)} style={{ width:150, padding:'4px 8px', fontSize:13 }} />
                            <button className="btn btn-primary" onClick={() => saveWebhookName(wh.id)} style={{ padding:'4px 10px', fontSize:12 }}>✓</button>
                            <button className="btn btn-ghost" onClick={() => setEditWh(null)} style={{ padding:'4px 10px', fontSize:12 }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditWh(wh.id); setEditName(wh.name ?? wh.label ?? '') }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text)', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                            {wh.name ?? wh.label ?? 'Sem nome'} ✏️
                          </button>
                        )}
                        <span className="badge" style={{ fontSize:10, background:'var(--brand-dim)', color:'var(--brand-l)' }}>
                          {saleTypeLabel[wh.sale_type] ?? wh.sale_type}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <span style={{ fontSize:11, color:'var(--dim)' }}>{wh.total_received} req</span>
                        <button onClick={() => toggleWebhook(wh.id, wh.active)} style={{ fontSize:11, padding:'2px 8px', borderRadius:5, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer', fontFamily:'inherit' }}>
                          {wh.active ? 'Pausar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <code style={{ flex:1, fontSize:11, color:'var(--dim)', background:'rgba(0,0,0,0.2)', padding:'6px 10px', borderRadius:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>
                        {appUrl}/api/webhook/braip/{wh.token}
                      </code>
                      <button onClick={() => copyUrl(wh.token)} className="btn btn-primary" style={{ padding:'6px 13px', fontSize:12, flexShrink:0 }}>
                        {copied === wh.token ? '✓' : 'Copiar'}
                      </button>
                    </div>
                    {wh.last_received_at && (
                      <div style={{ fontSize:11, color:'var(--dim)', marginTop:6 }}>Último: {formatDate(wh.last_received_at, 'dd/MM HH:mm')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
