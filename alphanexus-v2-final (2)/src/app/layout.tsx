import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'AlphaNexus Dashboard',
  description: 'Plataforma de gestão de operações com tráfego pago',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster
          theme="dark" position="bottom-right"
          toastOptions={{ style: { background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f8' } }}
        />
      </body>
    </html>
  )
}
