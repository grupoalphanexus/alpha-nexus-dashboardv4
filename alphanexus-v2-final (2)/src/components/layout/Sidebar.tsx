'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const NAV = [
  { href: '/dashboard',            label: 'Dashboard',      icon: '▣' },
  { href: '/dashboard/connect',    label: 'Integrações',    icon: '⛓' },
  { href: '/dashboard/attendants', label: 'Atendentes',     icon: '👥' },
  { href: '/dashboard/financial',  label: 'Financeiro',     icon: '💵' },
  { href: '/dashboard/cashflow',   label: 'Fluxo de Caixa', icon: '📊' },
  { href: '/dashboard/logs',       label: 'Logs Webhook',   icon: '📡' },
  { href: '/dashboard/settings',   label: 'Configurações',  icon: '⚙' },
]

interface Props { user: { name: string; avatar?: string | null; email: string } }

export default function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/auth/login')
  }

  return (
    <aside style={{ position:'fixed', left:0, top:0, bottom:0, width:232, background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:50 }}>
      {/* Logo */}
      <div style={{ padding:'24px 20px 18px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#6172f3,#8098fb)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(97,114,243,0.35)', flexShrink:0 }}>
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="display" style={{ fontWeight:800, fontSize:15, letterSpacing:'-0.01em', lineHeight:1.2 }}>
              Alpha<span style={{ color:'var(--brand)' }}>Nexus</span>
            </div>
            <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Dashboard v2</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              display:'flex', alignItems:'center', gap:9,
              padding:'9px 11px', borderRadius:9,
              color: active ? '#fff' : 'var(--muted)',
              background: active ? 'var(--brand-dim)' : 'transparent',
              fontWeight: active ? 600 : 400, fontSize:13.5,
              textDecoration:'none', transition:'all 0.15s',
              borderLeft: active ? '2px solid var(--brand)' : '2px solid transparent',
            }}>
              <span style={{ fontSize:14 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding:'12px 10px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 11px', marginBottom:6 }}>
          {user.avatar ? (
            <img src={user.avatar} alt="" style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover' }} />
          ) : (
            <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--brand-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--brand)', flexShrink:0 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
            <div style={{ fontSize:11, color:'var(--dim)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', fontSize:13, padding:'7px 12px' }}>
          Sair
        </button>
      </div>
    </aside>
  )
}
