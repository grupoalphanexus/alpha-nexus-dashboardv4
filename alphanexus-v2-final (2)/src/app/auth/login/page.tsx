'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function loginGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { toast.error(error.message); setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      {/* Glow */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(97,114,243,0.1) 0%, transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />

      <div className="card fade-up" style={{ width:'100%', maxWidth:400, padding:48, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,#6172f3,#8098fb)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 8px 28px rgba(97,114,243,0.4)' }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 className="display" style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.02em', marginBottom:6 }}>
            Alpha<span className="text-grad">Nexus</span>
          </h1>
          <p style={{ color:'var(--muted)', fontSize:14 }}>Dashboard de operações e tráfego pago</p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
          <span style={{ color:'var(--dim)', fontSize:12 }}>Entrar com</span>
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
        </div>

        <button onClick={loginGoogle} disabled={loading} className="btn" style={{ width:'100%', justifyContent:'center', background:'rgba(255,255,255,0.07)', border:'1px solid var(--border2)', color:'var(--text)', fontSize:15, padding:'13px 20px', borderRadius:12 }}>
          {loading ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" dur="0.8s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></circle></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          )}
          {loading ? 'Entrando...' : 'Continuar com Google'}
        </button>

        <p style={{ textAlign:'center', color:'var(--dim)', fontSize:12, marginTop:24, lineHeight:1.8 }}>
          Seus dados são isolados e protegidos por RLS.
        </p>
      </div>
    </div>
  )
}
