'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { TransactionLog } from '@/types'
import { STATUS_MAP, PAYMENT_MAP } from '@/types'

export default function LogsPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<TransactionLog[]>([])
  const [selected, setSelected] = useState<TransactionLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('transaction_logs').select('*').order('created_at', { ascending: false }).limit(200)
    setLogs(data ?? [])
    setLoading(false)
  }

  const typeColor = (t: string) => {
    if (t === 'STATUS_ALTERADO') return { color:'#60a5fa', bg:'rgba(96,165,250,0.1)' }
    if (t?.startsWith('TRACKING')) return { color:'#34d399', bg:'rgba(52,211,153,0.1)' }
    return { color:'var(--muted)', bg:'rgba(255,255,255,0.05)' }
  }

  const types = ['all', ...Array.from(new Set(logs.map(l => l.postback_type ?? 'unknown').filter(Boolean)))]
  const filtered = typeFilter === 'all' ? logs : logs.filter(l => l.postback_type === typeFilter)

  const p = selected?.raw_payload as Record<string, unknown> | null

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 className="display" style={{ fontWeight:800, fontSize:24, letterSpacing:'-0.02em' }}>Logs de Webhook</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Histórico de {logs.length} postbacks recebidos da Braip</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>↻ Atualizar</button>
      </div>

      {/* Filtros por tipo */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{ padding:'5px 12px', borderRadius:7, border:'1px solid var(--border)', background: typeFilter===t ? 'var(--brand)' : 'transparent', color: typeFilter===t ? 'white' : 'var(--muted)', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>
            {t === 'all' ? 'Todos' : t}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:20 }}>
        {/* Lista */}
        <div className="card">
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--muted)' }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:60, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📡</div>
              <p style={{ color:'var(--muted)' }}>Nenhum postback recebido ainda</p>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Tipo','Trans. Key','Status','Data',''].map(h => (
                    <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, color:'var(--dim)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const tc = typeColor(log.postback_type ?? '')
                  const raw = log.raw_payload as Record<string, unknown>
                  const code = Number(raw?.trans_status_code ?? 0)
                  const si = STATUS_MAP[code]
                  const isSelected = selected?.id === log.id
                  return (
                    <tr key={log.id} onClick={() => setSelected(isSelected ? null : log)}
                      style={{ borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none', cursor:'pointer', background: isSelected ? 'rgba(97,114,243,0.08)' : 'transparent', transition:'background 0.15s' }}>
                      <td style={{ padding:'10px 16px' }}>
                        <span className="badge" style={{ fontSize:10, color:tc.color, background:tc.bg }}>{log.postback_type}</span>
                      </td>
                      <td style={{ padding:'10px 16px' }}>
                        <code style={{ fontSize:11, color:'var(--muted)' }}>{log.trans_key ?? '—'}</code>
                      </td>
                      <td style={{ padding:'10px 16px' }}>
                        {si ? <span className="badge" style={{ fontSize:10, color:si.color, background:si.bg }}>{si.label}</span> : <span style={{ color:'var(--dim)', fontSize:12 }}>—</span>}
                      </td>
                      <td style={{ padding:'10px 16px', fontSize:11, color:'var(--dim)' }}>{formatDate(log.created_at, 'dd/MM HH:mm')}</td>
                      <td style={{ padding:'10px 16px', fontSize:12, color:'var(--brand)', fontWeight:600 }}>Ver →</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detalhe */}
        {selected && p && (
          <div className="card" style={{ padding:22, maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Detalhes do Postback</h3>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:20, padding:'0 4px' }}>×</button>
            </div>

            {/* Interpretado */}
            <div style={{ marginBottom:18 }}>
              <h4 style={{ fontSize:11, fontWeight:700, color:'var(--brand-l)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>🧠 Interpretado</h4>
              {[
                { k:'Atendente (src)', v: (p.meta as Record<string,unknown>)?.src as string ?? p.src as string ?? '—' },
                { k:'Status', v: p.trans_status as string ?? '—' },
                { k:'Tipo venda', v: p.trans_cash_on_delivery ? 'Antecipado' : p.trans_status_code === 2 ? 'Pago' : 'Agendado' },
                { k:'Cliente', v: p.client_name as string ?? '—' },
                { k:'Cidade', v: `${p.client_address_city ?? ''}${p.client_address_state ? ', ' + p.client_address_state : ''}` || '—' },
                { k:'Produto', v: p.product_name as string ?? '—' },
                { k:'Plano', v: p.plan_name as string ?? '—' },
                { k:'Valor total', v: p.trans_total_value ? formatCurrency((p.trans_total_value as number)/100) : '—' },
                { k:'Pagamento', v: PAYMENT_MAP[p.trans_payment as number] ?? '—' },
                { k:'Rastreio', v: p.tracking_code as string ?? '—' },
                { k:'Status entrega', v: p.last_status_delivery as string ?? '—' },
              ].filter(r => r.v && r.v !== '—' && r.v !== ', ').map(row => (
                <div key={row.k} style={{ display:'flex', gap:12, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:12, color:'var(--dim)', minWidth:130 }}>{row.k}</span>
                  <span style={{ fontSize:13, fontWeight:500 }}>{row.v}</span>
                </div>
              ))}

              {Array.isArray(p.commissions) && (
                <div style={{ marginTop:8 }}>
                  <span style={{ fontSize:12, color:'var(--dim)' }}>Comissões:</span>
                  {(p.commissions as Array<{ name: string; type: string; value: number }>).map((c, i) => (
                    <div key={i} style={{ fontSize:12, color:'var(--success)', marginTop:3, marginLeft:8 }}>
                      {c.name} ({c.type}): {formatCurrency(c.value/100)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* JSON bruto */}
            <h4 style={{ fontSize:11, fontWeight:700, color:'var(--dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>📦 JSON Bruto</h4>
            <pre style={{ fontSize:11, color:'var(--muted)', background:'rgba(0,0,0,0.3)', padding:14, borderRadius:9, overflow:'auto', maxHeight:280, lineHeight:1.6, border:'1px solid var(--border)', fontFamily:'monospace' }}>
              {JSON.stringify(selected.raw_payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
