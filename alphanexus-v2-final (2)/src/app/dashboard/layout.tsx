import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, email')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar user={{ name: profile?.full_name || user.email || '', avatar: profile?.avatar_url, email: profile?.email || user.email || '' }} />
      <main style={{ flex:1, marginLeft:232, padding:'28px 32px', minHeight:'100vh' }}>
        {children}
      </main>
    </div>
  )
}
