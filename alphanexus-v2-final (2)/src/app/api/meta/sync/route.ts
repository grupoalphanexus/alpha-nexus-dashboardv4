import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { ad_account_id } = await req.json() as { ad_account_id: string }

  const { data: acc } = await supabase.from('ad_accounts').select('*').eq('id', ad_account_id).eq('user_id', user.id).single()
  if (!acc) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })

  const { data: settings } = await supabase.from('settings').select('meta_tax_multiplier').eq('user_id', user.id).single()
  const tax = settings?.meta_tax_multiplier ?? 1.1383

  const today = new Date()
  const since = new Date(today); since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().split('T')[0]
  const untilStr = today.toISOString().split('T')[0]

  const fields = 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend'
  const url = `https://graph.facebook.com/v19.0/act_${acc.meta_account_id}/insights?fields=${fields}&time_range={"since":"${sinceStr}","until":"${untilStr}"}&level=ad&time_increment=1&limit=500&access_token=${acc.access_token}`

  const res = await fetch(url)
  const data = await res.json() as { data?: Array<Record<string, string>>; error?: { message: string } }

  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 })

  const insights = data.data ?? []
  let synced = 0

  for (const insight of insights) {
    const spend = parseFloat(insight.spend ?? '0')
    const { error } = await supabase.from('ad_insights').upsert({
      user_id: user.id,
      ad_account_id: acc.id,
      meta_account_id: acc.meta_account_id,
      campaign_id: insight.campaign_id ?? null,
      campaign_name: insight.campaign_name ?? null,
      adset_id: insight.adset_id ?? null,
      adset_name: insight.adset_name ?? null,
      ad_id: insight.ad_id ?? null,
      ad_name: insight.ad_name ?? null,
      spend,
      spend_with_tax: spend * tax,
      insight_date: insight.date_start,
    }, { onConflict: 'ad_account_id,ad_id,insight_date' })
    if (!error) synced++
  }

  await supabase.from('ad_accounts').update({ last_sync_at: new Date().toISOString() }).eq('id', acc.id)

  return NextResponse.json({ success: true, synced })
}
