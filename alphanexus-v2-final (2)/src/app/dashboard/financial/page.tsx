'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { BankAccount } from '@/types'

const BANKS = ['Banco do Brasil', 'Bradesco', 'Caixa Econômica', 'Itaú', 'Nubank', 'Santander', 'Sicoob', 'Inter', 'C6 Bank', 'Outro']
const COLORS = ['#6172f3','#34d399','#fbbf24','#f87171','#60a5fa','#a78bfa','#fb923c','#34d399']

export default function FinancialPage() {
  const supabase = createClient()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', bank: '', balance: 0, color: COLORS[0] })
  const [editId, setEditId] = useState<string | null>(null)
  const [editBalance, setEditBalance] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({ agendado: 0, pago: 0, a_receber: 0 })

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: acc }, { data: tx }] = await Promise.all([
      supabase.from('bank_accounts').select('*').order('created_at'),
      supabase.from('transactions').select('commission_value, sale_type, trans_status_code').eq('include_in_calc', true),
    ])
    setAccounts(acc ?? [])

    const txs = tx ?? []
    const pago = txs.filter(t => t.trans_status_code === 2).reduce((a, t) => a + (t.commission_value ?? 0), 0)
    const agendado = txs.filter(t => t.sale_type === 'agendado').reduce((a, t) => a + (t.commission_value ?? 0), 0)
    setSummary({ pago, agendado, a_receber: Math.max(0, agendado - pago) })
  }

  async function saveAccount() {
    if (!form.name) return toast.error('Nome obrigatório')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('bank_accounts').insert({ ...form, user_id: user!.id })
    if (error) toast.error(error.message)
    else { toast.success('Conta adicionada!'); setForm({ name: '', bank: '', balance: 0, color: COLORS[0] }); setShowForm(false) }
    setLoading(false)
    await load()
  }

  async function updateBalance(id: string) {
    const val = parseFloat(editBalance[id] ?? '0')
    await supabase.from('bank_accounts').update({ balance: val, updated_at: new Date().toISOString() }).eq('id', id)
    toast.success('Saldo atualizado!')
    setEditId(null)
    await load()
  }

  async function removeAccount(id: string) {
    if (!confirm('Remover conta?')) return
    await supabase.from('bank_accounts').delete().eq('id', id)
    toast.success('Removida')
    await load()
  }

  const totalBanks = accounts.filter(a => a.active).reduce((s, a) => s + a.balance, 0)
  const totalGeral = totalBanks + summary.a_receber + summary.pago

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 className="display" style={{ fontWeight:800, fontSize:24, letterSpacing:'-0.02em' }}>Financeiro</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Visão consolidada do seu caixa</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>+ Nova Conta</button>
      </div>

      {/* Blocos de resumo */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Saldo Bancário', value: totalBanks, sub: `${accounts.filter(a=>a.active).length} contas`, color:'var(--brand)', icon:'🏦' },
          { label:'A Receber', value: summary.a_receber, sub: 'Agendado − Pago', color:'var(--warn)', icon:'⏳' },
          { label:'Recebido (Braip)', value: summary.pago, sub: 'Total de comissões pagas', color:'var(--success)', icon:'✅' },
          { label:'Total Consolidado', value: totalGeral, sub: 'Bancos + A receber + Recebido', color:'var(--info)', icon:'📊' },
        ].map(b => (
          <div key={b.label} className="card" style={{ padding:'18px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:12.5, color:'var(--muted)' }}>{b.label}</span>
              <span style={{ fontSize:20 }}>{b.icon}</span>
            </div>
            <div className="metric" style={{ fontSize:24, color: b.value >= 0 ? b.color : 'var(--danger)', marginBottom:4 }}>{formatCurrency(b.value)}</div>
            <div style={{ fontSize:11, color:'var(--dim)' }}>{b.sub}</div>
          </div>
        ))}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card" style={{ padding:24, marginBottom:20 }}>
          <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>Nova Conta Bancária</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Nome da conta *</label>
              <input className="input" placeholder="Ex: Conta Empresa" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Banco</label>
              <select className="input" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}>
                <option value="">Selecione...</option>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Saldo atual (R$)</label>
              <input className="input" type="number" step="0.01" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:8 }}>Cor</label>
            <div style={{ display:'flex', gap:8 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width:28, height:28, borderRadius:'50%', background:c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor:'pointer', transition:'all 0.15s' }} />
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button className="btn btn-primary" onClick={saveAccount} disabled={loading}>{loading ? 'Salvando...' : 'Adicionar'}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista de contas */}
      {accounts.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🏦</div>
          <p style={{ color:'var(--muted)' }}>Nenhuma conta cadastrada</p>
          <p style={{ color:'var(--dim)', fontSize:13, marginTop:4 }}>Adicione suas contas bancárias para acompanhar o saldo consolidado</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
          {accounts.map(acc => (
            <div key={acc.id} className="card" style={{ padding:22, borderLeft:`3px solid ${acc.color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{acc.name}</div>
                  {acc.bank && <div style={{ fontSize:12, color:'var(--dim)', marginTop:2 }}>{acc.bank}</div>}
                </div>
                <button onClick={() => removeAccount(acc.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim)', fontSize:16, padding:'0 4px' }}>✕</button>
              </div>

              {editId === acc.id ? (
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input className="input" type="number" step="0.01" value={editBalance[acc.id] ?? String(acc.balance)}
                    onChange={e => setEditBalance(b => ({ ...b, [acc.id]: e.target.value }))}
                    style={{ flex:1 }}
                  />
                  <button className="btn btn-primary" onClick={() => updateBalance(acc.id)} style={{ padding:'8px 12px', fontSize:12 }}>✓</button>
                  <button className="btn btn-ghost" onClick={() => setEditId(null)} style={{ padding:'8px 12px', fontSize:12 }}>✕</button>
                </div>
              ) : (
                <div>
                  <div className="metric" style={{ fontSize:26, color: acc.balance >= 0 ? 'var(--success)' : 'var(--danger)', marginBottom:8 }}>
                    {formatCurrency(acc.balance)}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'var(--dim)' }}>Atualizado: {formatDate(acc.updated_at, 'dd/MM HH:mm')}</span>
                    <button onClick={() => { setEditId(acc.id); setEditBalance(b => ({ ...b, [acc.id]: String(acc.balance) })) }} className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12 }}>
                      Editar saldo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
