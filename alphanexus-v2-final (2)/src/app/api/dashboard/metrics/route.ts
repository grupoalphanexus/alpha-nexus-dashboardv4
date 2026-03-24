import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const from = p.get('from') ?? new Date().toISOString().split('T')[0]
  const to = p.get('to') ?? new Date().toISOString().split('T')[0]
  const src = p.get('src') ?? null

  // Buscar todas as transações do período (usando order_date para agendadas/antecipadas, paid_at para pagas)
  let q = supabase.from('transactions').select('*').eq('user_id', user.id).eq('include_in_calc', true)
  if (src) q = q.eq('src', src)
  const { data: allTx } = await q

  const txs = allTx ?? []

  // Agendadas: criadas no período
  const agendadas = txs.filter(t => t.sale_type === 'agendado' && t.order_date >= from && t.order_date <= to)
  // Antecipadas: criadas no período
  const antecipadas = txs.filter(t => t.sale_type === 'antecipado' && t.order_date >= from && t.order_date <= to)
  // Pagas: pagas no período (paid_at)
  const pagas = txs.filter(t => t.trans_status_code === 2 && t.paid_at && t.paid_at.slice(0,10) >= from && t.paid_at.slice(0,10) <= to)
  // Frustradas no período
  const frustradas = txs.filter(t => t.is_real_frustration && t.order_date >= from && t.order_date <= to)

  const comissao_real = pagas.reduce((a, t) => a + (t.commission_value ?? 0), 0)
  const comissao_projetada = [...agendadas, ...antecipadas].reduce((a, t) => a + (t.commission_value ?? 0), 0)
  const valor_agendado_total = agendadas.reduce((a, t) => a + (t.commission_value ?? 0), 0)
  const valor_a_receber = Math.max(0, valor_agendado_total - comissao_real)

  // Investimento
  const { data: insights } = await supabase
    .from('ad_insights').select('spend, spend_with_tax, campaign_name, insight_date')
    .eq('user_id', user.id).gte('insight_date', from).lte('insight_date', to)

  const ins = insights ?? []
  const investimento_sem = ins.reduce((a, i) => a + (i.spend ?? 0), 0)
  const investimento_com = ins.reduce((a, i) => a + (i.spend_with_tax ?? 0), 0)

  // CAC
  const total_para_cac = agendadas.length + antecipadas.length
  const cac = total_para_cac > 0 ? investimento_com / total_para_cac : 0

  // Gráfico diário
  const dailyMap: Record<string, { date: string; commission: number; spend: number; agendadas: number; pagas: number }> = {}
  for (const tx of agendadas) {
    const d = tx.order_date as string
    if (!dailyMap[d]) dailyMap[d] = { date: d, commission: 0, spend: 0, agendadas: 0, pagas: 0 }
    dailyMap[d].agendadas += 1
  }
  for (const tx of pagas) {
    const d = (tx.paid_at as string).slice(0, 10)
    if (!dailyMap[d]) dailyMap[d] = { date: d, commission: 0, spend: 0, agendadas: 0, pagas: 0 }
    dailyMap[d].commission += tx.commission_value ?? 0
    dailyMap[d].pagas += 1
  }
  for (const i of ins) {
    const d = i.insight_date as string
    if (!dailyMap[d]) dailyMap[d] = { date: d, commission: 0, spend: 0, agendadas: 0, pagas: 0 }
    dailyMap[d].spend += i.spend_with_tax ?? 0
  }
  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // Campanhas
  const campMap: Record<string, { name: string; spend: number; commission: number; sales: number }> = {}
  for (const i of ins) {
    const n = i.campaign_name ?? 'Sem campanha'
    if (!campMap[n]) campMap[n] = { name: n, spend: 0, commission: 0, sales: 0 }
    campMap[n].spend += i.spend_with_tax ?? 0
  }
  for (const tx of pagas) {
    const n = tx.utm_campaign ?? 'Sem campanha'
    if (!campMap[n]) campMap[n] = { name: n, spend: 0, commission: 0, sales: 0 }
    campMap[n].commission += tx.commission_value ?? 0
    campMap[n].sales += 1
  }

  // Por atendente
  const attMap: Record<string, { src: string; commission: number; sales: number; scheduled: number }> = {}
  for (const tx of [...agendadas, ...antecipadas, ...pagas]) {
    const s = tx.src ?? 'Desconhecido'
    if (!attMap[s]) attMap[s] = { src: s, commission: 0, sales: 0, scheduled: 0 }
    if (tx.trans_status_code === 2) { attMap[s].commission += tx.commission_value ?? 0; attMap[s].sales += 1 }
    else attMap[s].scheduled += 1
  }

  return NextResponse.json({
    kpis: {
      agendadas_count: agendadas.length,
      antecipadas_count: antecipadas.length,
      pagas_count: pagas.length,
      comissao_real,
      comissao_projetada,
      valor_a_receber,
      investimento_sem_imposto: investimento_sem,
      investimento_com_imposto: investimento_com,
      cac,
      roi_real: investimento_com > 0 ? comissao_real / investimento_com : 0,
      roi_projetado: investimento_com > 0 ? comissao_projetada / investimento_com : 0,
      frustradas_count: frustradas.length,
      frustration_rate: txs.length > 0 ? (frustradas.length / txs.length) * 100 : 0,
      lucro: comissao_real - investimento_com,
      lucro_projetado: comissao_projetada - investimento_com,
    },
    daily,
    campaigns: Object.values(campMap),
    attendants: Object.values(attMap),
  })
}
