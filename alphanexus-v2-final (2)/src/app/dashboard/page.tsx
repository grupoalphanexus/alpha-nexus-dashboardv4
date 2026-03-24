'use client'
import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import KpiCard from '@/components/dashboard/KpiCard'
import DateFilter from '@/components/dashboard/DateFilter'
import { formatCurrency, formatPercent, getDateRange, getROIColor, getFrustrationColor, getCampaignScore } from '@/lib/utils'
import type { DatePreset, DateRange, DashboardMetrics, DailyData, CampaignData, AttendantData } from '@/types'

interface ApiResponse {
  kpis: DashboardMetrics & {
    roi_real: number; roi_projetado: number
    lucro: number; lucro_projetado: number
  }
  daily: DailyData[]
  campaigns: CampaignData[]
  attendants: AttendantData[]
}

const Tip = ({ active, payload, label }: Record<string, unknown>) => {
  if (!active || !Array.isArray(payload) || !payload.length) return null
  return (
    <div style={{ background:'#1a1d2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px' }}>
      <p style={{ color:'var(--dim)', fontSize:11, marginBottom:5 }}>{String(label)}</p>
      {(payload as { color: string; name: string; value: number }[]).map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize:13, fontWeight:600 }}>
          {p.name}: {p.name === 'Agendadas' || p.name === 'Pagas' ? p.value : formatCurrency(Number(p.value))}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<DatePreset>('7d')
  const [custom, setCustom] = useState<DateRange | undefined>()
  const [srcFilter, setSrcFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { from, to } = getDateRange(preset, custom)
    const params = new URLSearchParams({ from, to })
    if (srcFilter) params.set('src', srcFilter)
    const res = await fetch(`/api/dashboard/metrics?${params}`)
    const json = await res.json() as ApiResponse
    setData(json)
    setLoading(false)
  }, [preset, custom, srcFilter])

  useEffect(() => { void load() }, [load])

  const k = data?.kpis
  const daily = data?.daily ?? []
  const campaigns = data?.campaigns ?? []
  const attendants = data?.attendants ?? []

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h1 className="display" style={{ fontWeight:800, fontSize:24, letterSpacing:'-0.02em' }}>Dashboard</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Operações em tempo real</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
          <input className="input" placeholder="Filtrar por src (atendente)..." value={srcFilter}
            onChange={e => setSrcFilter(e.target.value)}
            style={{ width:210 }}
          />
          <DateFilter preset={preset} custom={custom} onPreset={setPreset} onCustom={setCustom} />
          <button onClick={load} className="btn btn-ghost" style={{ padding:'7px 14px' }}>↻</button>
        </div>
      </div>

      {/* KPIs linha 1 — Vendas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
        <KpiCard title="Agendadas" value={loading ? '...' : String(k?.agendadas_count ?? 0)}
          sub="Criadas no período" icon="📅" color="var(--brand)" loading={loading}
          tooltip="Vendas com tipo 'agendado' criadas no período selecionado (usa data do pedido)." />
        <KpiCard title="Antecipadas" value={loading ? '...' : String(k?.antecipadas_count ?? 0)}
          sub="Pagas antes da entrega" icon="⚡" color="var(--warn)" loading={loading}
          tooltip="Vendas pagas antecipadamente (Cash on Delivery). Criadas no período." />
        <KpiCard title="Pagas" value={loading ? '...' : String(k?.pagas_count ?? 0)}
          sub="Baseado na data de pagamento" icon="✅" color="var(--success)" loading={loading}
          tooltip="Vendas com status 'Pagamento Aprovado' cuja data de pagamento (paid_at) cai no período." />
      </div>

      {/* KPIs linha 2 — Financeiro */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:14 }}>
        <KpiCard title="Comissão Real" value={loading ? '...' : formatCurrency(k?.comissao_real ?? 0)}
          sub="Vendas pagas no período" icon="💰" color="var(--success)" loading={loading}
          highlight={k && k.comissao_real > 0 ? 'positive' : 'neutral'}
          tooltip="Soma das comissões das vendas efetivamente pagas no período.\nFórmula: Σ commission_value (status = Pago, paid_at no período)." />
        <KpiCard title="Comissão Projetada" value={loading ? '...' : formatCurrency(k?.comissao_projetada ?? 0)}
          sub="Agendadas + Antecipadas" icon="📈" color="var(--brand)" loading={loading}
          tooltip="Potencial de recebimento: soma das comissões das agendadas + antecipadas criadas no período.\nNão inclui as que já foram pagas." />
        <KpiCard title="Valor a Receber" value={loading ? '...' : formatCurrency(k?.valor_a_receber ?? 0)}
          sub="Agendado − Pago" icon="⏳" color="var(--info)" loading={loading}
          highlight={k && k.valor_a_receber > 0 ? 'positive' : 'neutral'}
          tooltip={`Fórmula: Total agendado − Total já pago.\nRepresenta o que ainda está a receber das vendas agendadas.`} />
        <KpiCard title="Lucro Líquido" value={loading ? '...' : formatCurrency(k?.lucro ?? 0)}
          sub="Comissão − Investimento" icon="🏆" color={k && k.lucro >= 0 ? 'var(--success)' : 'var(--danger)'} loading={loading}
          highlight={k ? (k.lucro >= 0 ? 'positive' : 'negative') : 'neutral'}
          tooltip="Lucro = Comissão real − Investimento com imposto.\nValor negativo indica prejuízo no período." />
      </div>

      {/* KPIs linha 3 — Performance */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:26 }}>
        <KpiCard title="Investimento (c/ imposto)" value={loading ? '...' : formatCurrency(k?.investimento_com_imposto ?? 0)}
          sub={`Sem imposto: ${formatCurrency(k?.investimento_sem_imposto ?? 0)}`}
          icon="💸" color="var(--warn)" loading={loading}
          tooltip="Valor total gasto em Meta Ads multiplicado pelo fator de imposto.\nFator padrão: 1.1383 (configurável em Configurações)." />
        <KpiCard title="ROI Real" value={loading ? '...' : `${(k?.roi_real ?? 0).toFixed(2)}x`}
          sub="Comissão ÷ Investimento" icon="📊" color={getROIColor(k?.roi_real ?? 0)} loading={loading}
          tooltip={`ROI = Comissão real ÷ Investimento com imposto.\n2x = recebeu R$2 para cada R$1 investido.\nAbaixo de 1x = prejuízo.`} />
        <KpiCard title="CAC" value={loading ? '...' : formatCurrency(k?.cac ?? 0)}
          sub={`${(k?.agendadas_count ?? 0) + (k?.antecipadas_count ?? 0)} vendas no denominador`}
          icon="🎯" color="var(--info)" loading={loading}
          tooltip={`CAC = Investimento com imposto ÷ (Agendadas + Antecipadas).\nCusto para adquirir cada cliente no período.`} />
        <KpiCard title="Taxa de Frustração" value={loading ? '...' : formatPercent(k?.frustration_rate ?? 0)}
          sub={`${k?.frustradas_count ?? 0} frustrações reais`}
          icon="⚠️" color={getFrustrationColor(k?.frustration_rate ?? 0)} loading={loading}
          highlight={k ? (k.frustration_rate > 30 ? 'negative' : k.frustration_rate > 15 ? 'neutral' : 'positive') : 'neutral'}
          tooltip="Conta apenas vendas 'Frustrada' E não entregues.\nFrustrações pós-entrega NÃO entram no cálculo." />
      </div>

      {/* Gráficos */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:18, marginBottom:18 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
            <div>
              <h3 style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>Comissão vs Investimento</h3>
              <p style={{ color:'var(--dim)', fontSize:12 }}>Evolução diária no período</p>
            </div>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              {[['#6172f3','Comissão'],['#fbbf24','Investimento']].map(([c,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:9, height:9, borderRadius:2, background:c }} />
                  <span style={{ fontSize:11, color:'var(--muted)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <defs>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6172f3" stopOpacity={0.3}/><stop offset="95%" stopColor="#6172f3" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/><stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill:'#5a5f70', fontSize:11 }} tickLine={false} axisLine={false} tickFormatter={v => String(v).slice(5)} />
              <YAxis tick={{ fill:'#5a5f70', fontSize:11 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(Number(v)/1000).toFixed(0)}k`} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="commission" name="Comissão" stroke="#6172f3" strokeWidth={2} fill="url(#gC)" />
              <Area type="monotone" dataKey="spend" name="Investimento" stroke="#fbbf24" strokeWidth={2} fill="url(#gS)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:22 }}>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:18 }}>Status das Vendas</h3>
          {[
            { label:'Agendadas', count: k?.agendadas_count ?? 0, color:'#6172f3', total: (k?.agendadas_count ?? 0) + (k?.antecipadas_count ?? 0) + (k?.pagas_count ?? 0) },
            { label:'Antecipadas', count: k?.antecipadas_count ?? 0, color:'#fbbf24', total: (k?.agendadas_count ?? 0) + (k?.antecipadas_count ?? 0) + (k?.pagas_count ?? 0) },
            { label:'Pagas', count: k?.pagas_count ?? 0, color:'#34d399', total: (k?.agendadas_count ?? 0) + (k?.antecipadas_count ?? 0) + (k?.pagas_count ?? 0) },
            { label:'Frustradas', count: k?.frustradas_count ?? 0, color:'#f87171', total: (k?.agendadas_count ?? 0) + (k?.antecipadas_count ?? 0) + (k?.pagas_count ?? 0) },
          ].map(item => (
            <div key={item.label} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:12.5, color:'var(--muted)' }}>{item.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color: item.color }}>{item.count}</span>
              </div>
              <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width: item.total > 0 ? `${(item.count/item.total)*100}%` : '0%', background:item.color, borderRadius:3, transition:'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campanhas + Atendentes */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
        <div className="card" style={{ padding:22 }}>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:18 }}>Performance por Campanha</h3>
          {campaigns.length === 0 ? <Empty msg="Nenhuma campanha no período" /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {campaigns.slice(0,6).map((c, i) => {
                const roi = c.spend > 0 ? c.commission / c.spend : 0
                const score = getCampaignScore(roi, 0)
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.025)', borderRadius:9 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12.5, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize:11, color:'var(--dim)', marginTop:1 }}>Gasto: {formatCurrency(c.spend)} · {c.sales} vendas</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:13, fontWeight:700, color: roi >= 2 ? 'var(--success)' : roi >= 1 ? 'var(--warn)' : 'var(--danger)' }}>{roi.toFixed(2)}x</div>
                      <span className="badge" style={{ fontSize:10, color: score.color, background: score.bg }}>{score.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding:22 }}>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:18 }}>Ranking de Atendentes</h3>
          {attendants.length === 0 ? <Empty msg="Cadastre atendentes para ver o ranking" /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {attendants.sort((a, b) => b.commission - a.commission).slice(0,6).map((a, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.025)', borderRadius:9 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background: i===0 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color: i===0 ? '#fbbf24' : 'var(--dim)', flexShrink:0 }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{a.src}</div>
                    <div style={{ fontSize:11, color:'var(--dim)' }}>{a.sales} pagas · {a.scheduled} agendadas</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--success)' }}>{formatCurrency(a.commission)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agendamentos por dia */}
      <div className="card" style={{ padding:22 }}>
        <h3 style={{ fontWeight:700, fontSize:14, marginBottom:18 }}>Agendamentos por Dia</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={daily} margin={{ top:0, right:0, left:-20, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill:'#5a5f70', fontSize:11 }} tickLine={false} axisLine={false} tickFormatter={v => String(v).slice(5)} />
            <YAxis tick={{ fill:'#5a5f70', fontSize:11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="agendadas" name="Agendadas" fill="#6172f3" radius={[4,4,0,0]} />
            <Bar dataKey="pagas" name="Pagas" fill="#34d399" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ textAlign:'center', padding:'32px 0', color:'var(--dim)', fontSize:13 }}>{msg}</div>
}
