'use client'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Cashflow, CashflowType } from '@/types'
import { CASHFLOW_CATEGORIES } from '@/types'

const COLORS_OUT = ['#f87171','#fb923c','#fbbf24','#a78bfa','#60a5fa','#34d399','#f472b6','#94a3b8']
const COLORS_IN  = ['#34d399','#6172f3','#60a5fa','#fbbf24','#f472b6']

const EMPTY = { type: 'entrada' as CashflowType, category: 'outro', description: '', amount: 0, reference_date: new Date().toISOString().split('T')[0], payment_method: '', notes: '' }

export default function CashflowPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Cashflow[]>([])
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'entrada' | 'saida'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('cashflow').select('*').order('reference_date', { ascending: false })
    setItems(data ?? [])
  }

  async function save() {
    if (!form.description || !form.amount) return toast.error('Preencha descrição e valor')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('cashflow').insert({ ...form, user_id: user!.id })
    if (error) toast.error(error.message)
    else { toast.success('Lançamento adicionado!'); setForm(EMPTY); setShowForm(false) }
    setLoading(false)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Remover?')) return
    await supabase.from('cashflow').delete().eq('id', id)
    toast.success('Removido')
    await load()
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)
  const totalIn  = items.filter(i => i.type === 'entrada').reduce((a, i) => a + i.amount, 0)
  const totalOut = items.filter(i => i.type === 'saida').reduce((a, i) => a + i.amount, 0)
  const balance  = totalIn - totalOut

  // Dados para pizza
  const outByCat = Object.entries(
    items.filter(i => i.type === 'saida').reduce<Record<string,number>>((a, i) => ({ ...a, [i.category]: (a[i.category] ?? 0) + i.amount }), {})
  ).map(([name, value]) => ({ name, value }))

  const inByCat = Object.entries(
    items.filter(i => i.type === 'entrada').reduce<Record<string,number>>((a, i) => ({ ...a, [i.category]: (a[i.category] ?? 0) + i.amount }), {})
  ).map(([name, value]) => ({ name, value }))

  const cats = CASHFLOW_CATEGORIES[form.type === 'entrada' ? 'entrada' : 'saida']

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 className="display" style={{ fontWeight:800, fontSize:24, letterSpacing:'-0.02em' }}>Fluxo de Caixa</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Controle completo de entradas e saídas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>+ Novo Lançamento</button>
      </div>

      {/* Resumo */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Entradas', value: totalIn,  color:'var(--success)', icon:'↑' },
          { label:'Total Saídas',   value: totalOut, color:'var(--danger)',  icon:'↓' },
          { label:'Saldo',          value: balance,  color: balance >= 0 ? 'var(--success)' : 'var(--danger)', icon:'⚖' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'18px 22px' }}>
            <p style={{ fontSize:12.5, color:'var(--muted)', marginBottom:10 }}>{s.label}</p>
            <p className="metric" style={{ fontSize:26, color: s.color }}>{s.icon} {formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Gráficos pizza */}
      {(outByCat.length > 0 || inByCat.length > 0) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:24 }}>
          {[
            { title:'Saídas por categoria', data: outByCat, colors: COLORS_OUT },
            { title:'Entradas por categoria', data: inByCat, colors: COLORS_IN },
          ].map(chart => (
            chart.data.length > 0 && (
              <div key={chart.title} className="card" style={{ padding:22 }}>
                <h3 style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>{chart.title}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chart.data} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {chart.data.map((_, i) => <Cell key={i} fill={chart.colors[i % chart.colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background:'#1a1d2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )
          ))}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="card" style={{ padding:24, marginBottom:20 }}>
          <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>Novo Lançamento</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Tipo</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CashflowType, category: 'outro' }))}>
                <option value="entrada">↑ Entrada</option>
                <option value="saida">↓ Saída</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Categoria</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {cats.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Descrição *</label>
              <input className="input" placeholder="Descreva o lançamento" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Valor (R$) *</label>
              <input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Data</label>
              <input className="input" type="date" value={form.reference_date} onChange={e => setForm(f => ({ ...f, reference_date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Forma de pagamento</label>
              <select className="input" value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                <option value="">Selecione...</option>
                {['Pix', 'Transferência', 'Cartão', 'Boleto', 'Dinheiro', 'Outro'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Salvando...' : 'Adicionar'}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {(['all','entrada','saida'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background: filter===f ? 'var(--brand)' : 'transparent', color: filter===f ? 'white' : 'var(--muted)', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'all 0.15s' }}>
            {f === 'all' ? 'Todos' : f === 'entrada' ? '↑ Entradas' : '↓ Saídas'}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>💸</div>
            <p style={{ color:'var(--muted)' }}>Nenhum lançamento</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Data','Descrição','Categoria','Pagamento','Tipo','Valor',''].map(h => (
                  <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:11, color:'var(--dim)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding:'12px 18px', fontSize:13, color:'var(--muted)' }}>{formatDate(item.reference_date)}</td>
                  <td style={{ padding:'12px 18px', fontSize:13, fontWeight:500 }}>{item.description}</td>
                  <td style={{ padding:'12px 18px' }}>
                    <span className="badge" style={{ background:'rgba(255,255,255,0.05)', color:'var(--muted)', fontSize:11 }}>{item.category.replace(/_/g,' ')}</span>
                  </td>
                  <td style={{ padding:'12px 18px', fontSize:12, color:'var(--dim)' }}>{item.payment_method ?? '—'}</td>
                  <td style={{ padding:'12px 18px' }}>
                    <span className="badge" style={{ color: item.type==='entrada' ? 'var(--success)' : 'var(--danger)', background: item.type==='entrada' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', fontSize:11 }}>
                      {item.type === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 18px', fontSize:14, fontWeight:700, color: item.type==='entrada' ? 'var(--success)' : 'var(--danger)' }}>
                    {item.type==='entrada' ? '+' : '−'} {formatCurrency(item.amount)}
                  </td>
                  <td style={{ padding:'12px 18px' }}>
                    {!item.is_auto && <button onClick={() => remove(item.id)} className="btn btn-danger" style={{ padding:'4px 10px', fontSize:11 }}>Remover</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
