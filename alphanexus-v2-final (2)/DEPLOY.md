# 🚀 AlphaNexus Dashboard v2 — Guia de Deploy

## O que mudou na v2

- ✅ OAuth Meta Ads (botão Conectar Facebook — sem token manual)
- ✅ KPIs corrigidos: Agendadas / Antecipadas / Pagas com datas separadas
- ✅ Valor a Receber (agendado − pago)
- ✅ Filtro de data personalizado
- ✅ Múltiplos webhooks com tipo e nome editável
- ✅ Aba Financeiro: saldo bancário multi-contas + consolidado
- ✅ Fluxo de Caixa: gráficos pizza + categorias
- ✅ Atendentes: metas progressivas com faixas de comissão
- ✅ TypeScript corrigido: sem erros de build
- ✅ Next.js 15 (sem vulnerabilidades)
- ✅ Banco atualizado sem perder dados existentes

---

## PASSO 1 — Variáveis de ambiente na Vercel

Nas configurações do projeto na Vercel, adicione:

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role |
| `NEXT_PUBLIC_APP_URL` | Sua URL da Vercel (ex: https://alphanexus.vercel.app) |
| `META_APP_ID` | Meta for Developers → seu app → App ID |
| `META_APP_SECRET` | Meta for Developers → seu app → App Secret |
| `NEXT_PUBLIC_META_APP_ID` | Mesmo valor que META_APP_ID |

---

## PASSO 2 — Configurar Meta App para OAuth

1. Acesse https://developers.facebook.com
2. Crie um app do tipo **Business**
3. Adicione o produto **Facebook Login**
4. Em **Facebook Login → Settings → Valid OAuth Redirect URIs**, adicione:
   ```
   https://SEU-DOMINIO.vercel.app/api/meta/callback
   ```
5. Copie o **App ID** e **App Secret** para as variáveis acima
6. Em **App Review**, solicite as permissões:
   - `ads_read`
   - `read_insights`
   - `business_management`

> **Atenção:** Enquanto o app estiver em modo de desenvolvimento, só contas de teste podem fazer login. Para usar em produção, submeta o app para revisão da Meta.

---

## PASSO 3 — Subir no GitHub e fazer Deploy

1. Extraia o ZIP — os arquivos devem estar **direto na raiz** (sem subpasta)
2. Suba para o GitHub
3. Na Vercel: **New Project** → importe o repositório
4. Adicione todas as variáveis do Passo 1
5. **Root Directory**: deixe **em branco**
6. Deploy!

---

## PASSO 4 — Configurar Supabase Auth

1. Supabase → Authentication → URL Configuration
2. **Site URL**: `https://SEU-DOMINIO.vercel.app`
3. **Redirect URLs**: `https://SEU-DOMINIO.vercel.app/auth/callback`

---

## PASSO 5 — Primeiros passos no sistema

1. **Login** com Google
2. **Integrações** → Webhook Braip → Criar webhook → Copiar link → Colar na Braip
3. **Integrações** → Meta Ads → Conectar com Facebook → Autorizar → Sync
4. **Atendentes** → Cadastrar cada atendente com a chave `src` exata do link
5. **Configurações** → Ajustar multiplicador de imposto se necessário
6. **Dashboard** → Ver KPIs em tempo real

---

## Regras dos KPIs (para entender os números)

| KPI | Lógica |
|---|---|
| Agendadas | sale_type = agendado, filtrado por `order_date` (data do pedido) |
| Antecipadas | sale_type = antecipado, filtrado por `order_date` |
| Pagas | status_code = 2, filtrado por `paid_at` (data do pagamento) |
| Comissão Real | soma das comissões das vendas pagas no período |
| Comissão Projetada | soma das comissões das agendadas + antecipadas |
| Valor a Receber | total agendado − total já pago |
| CAC | Investimento com imposto ÷ (Agendadas + Antecipadas) |
| Frustração Real | Frustrada E NÃO entregue |

---

## Banco de dados — Supabase ID: yqvipidbzyyklxxktffd

O banco já está configurado e atualizado. Tabelas principais:

- `profiles`, `settings` — usuários
- `ad_accounts`, `ad_insights` — Meta Ads
- `webhooks`, `transactions`, `transaction_logs` — Braip
- `attendants`, `attendant_rules`, `attendant_entries` — Equipe
- `bank_accounts`, `cashflow`, `manual_entries` — Financeiro

---

*AlphaNexus Dashboard v2.0 — Next.js 15 + Supabase + Vercel*
