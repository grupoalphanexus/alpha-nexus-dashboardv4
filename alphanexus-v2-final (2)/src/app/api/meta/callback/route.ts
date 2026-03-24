import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/meta/callback - recebe o code do OAuth da Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // user_id codificado

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect?error=missing_params`)
  }

  try {
    // Trocar code por access_token
    const appId = process.env.META_APP_ID!
    const appSecret = process.env.META_APP_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } }

    if (tokenData.error || !tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect?error=oauth_failed`)
    }

    // Buscar long-lived token
    const llRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const llData = await llRes.json() as { access_token?: string }
    const longToken = llData.access_token ?? tokenData.access_token

    // Buscar contas de anúncio
    const adAccRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${longToken}`
    )
    const adAccData = await adAccRes.json() as { data?: Array<{ id: string; name: string; account_status: number }> }
    const adAccounts = adAccData.data ?? []

    // Salvar primeira conta (ou todas)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)

    for (const acc of adAccounts.slice(0, 5)) {
      const accountId = acc.id.replace('act_', '')
      await supabase.from('ad_accounts').upsert({
        user_id: user.id,
        meta_account_id: accountId,
        name: acc.name,
        account_name: acc.name,
        access_token: longToken,
        oauth_connected: true,
        active: true,
      }, { onConflict: 'user_id,meta_account_id' })
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect?success=meta_connected`)
  } catch (err) {
    console.error('[META OAUTH]', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect?error=internal`)
  }
}
