import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function mapSaleType(body: Record<string, unknown>): 'agendado' | 'antecipado' | 'pago' {
  const code = Number(body.trans_status_code)
  if (code === 2) return 'pago'
  if (body.trans_cash_on_delivery === true || body.trans_pay_on_delivery === 1) return 'antecipado'
  return 'agendado'
}

function mapStatus(code: number): string {
  const m: Record<number, string> = { 1:'Pendente', 2:'Pago', 3:'Cancelado', 4:'Chargeback', 5:'Devolvido', 6:'Em Análise', 7:'Estorno Pendente', 8:'Processando', 9:'Parcial', 10:'Atrasado', 11:'Agendado', 12:'Frustrado' }
  return m[code] ?? 'Desconhecido'
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  try {
    const body = await req.json() as Record<string, unknown>

    const { data: wh } = await admin.from('webhooks').select('id,user_id,active,braip_auth_key,sale_type').eq('token', token).single()
    if (!wh) return NextResponse.json({ error: 'Webhook inválido' }, { status: 404 })
    if (!wh.active) return NextResponse.json({ error: 'Inativo' }, { status: 403 })

    if (wh.braip_auth_key && body.basic_authentication !== wh.braip_auth_key) {
      return NextResponse.json({ error: 'Auth inválida' }, { status: 401 })
    }

    const uid: string = wh.user_id

    // Salvar log
    await admin.from('transaction_logs').insert({
      user_id: uid, webhook_id: wh.id,
      trans_key: body.trans_key ?? null,
      postback_type: body.type ?? null,
      raw_payload: body, processed: true,
    })

    // Incrementar contador
    await admin.rpc('increment_webhook_count', { webhook_id: wh.id })

    const type = String(body.type ?? '')

    if (type === 'STATUS_ALTERADO') {
      const meta = (body.meta as Record<string, unknown>) ?? {}
      const commissions = (body.commissions as Array<Record<string, unknown>>) ?? []
      const commission = commissions
        .filter(c => c.type !== 'Sistema')
        .reduce((a, c) => a + (Number(c.value ?? 0) / 100), 0)

      const statusCode = Number(body.trans_status_code ?? 0)
      const saleType = mapSaleType(body)
      const isRealFrustration = statusCode === 12 && body.last_status_delivery !== 'Entregue'
      const payDate = body.trans_payment_date ? String(body.trans_payment_date) : null
      const createDate = body.trans_createdate ? String(body.trans_createdate) : null

      await admin.from('transactions').upsert({
        user_id: uid, webhook_id: wh.id,
        trans_key: String(body.trans_key),
        product_name: body.product_name ?? null,
        product_key: body.product_key ?? null,
        plan_name: body.plan_name ?? null,
        plan_key: body.plan_key ?? null,
        trans_status: body.trans_status ?? null,
        trans_status_code: statusCode,
        custom_status: mapStatus(statusCode),
        trans_total_value: Number(body.trans_total_value ?? 0) / 100,
        trans_value: Number(body.trans_value ?? 0) / 100,
        trans_discount: Number(body.trans_discount_value ?? 0) / 100,
        trans_freight: Number(body.trans_freight ?? 0) / 100,
        commission_value: commission,
        sale_type: saleType,
        payment_method: body.trans_payment ? Number(body.trans_payment) : null,
        trans_installments: Number(body.trans_installments ?? 1),
        is_cod: body.trans_pay_on_delivery === 1 || body.trans_cash_on_delivery === true,
        trans_payment_date: payDate,
        trans_create_date: createDate,
        paid_at: statusCode === 2 ? payDate : null,
        order_date: createDate ? createDate.split(' ')[0] : null,
        src: meta.src ?? null,
        utm_campaign: meta.utm_campaign ?? null,
        utm_content: meta.utm_content ?? null,
        utm_source: meta.utm_source ?? null,
        utm_medium: meta.utm_medium ?? null,
        fbclid: meta.fbclid ?? null,
        tracking_code: body.tracking_code ?? null,
        shipping_company: body.shipping_company ?? null,
        freight_type: body.trans_freight_type ?? null,
        delivery_status: body.last_status_delivery ?? null,
        is_delivered: body.last_status_delivery === 'Entregue',
        client_name: body.client_name ?? null,
        client_email: body.client_email ?? null,
        client_city: body.client_address_city ?? null,
        client_state: body.client_address_state ?? null,
        is_real_frustration: isRealFrustration,
        is_upsell: body.is_upsell === '1' || body.is_upsell === 1,
        include_in_calc: true,
      }, { onConflict: 'user_id,trans_key' })
    }

    if (type.startsWith('TRACKING')) {
      const isDelivered = body.last_status_delivery === 'Entregue'
      await admin.from('transactions').update({
        tracking_code: body.tracking_code ?? null,
        shipping_company: body.shipping_company ?? null,
        delivery_status: body.last_status_delivery ?? null,
        is_delivered: isDelivered,
        is_real_frustration: !isDelivered,
      }).match({ user_id: uid, trans_key: String(body.trans_key) })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WEBHOOK]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
