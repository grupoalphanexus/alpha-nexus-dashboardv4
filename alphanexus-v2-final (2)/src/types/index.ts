// ============ ENUMS ============
export type SaleType = 'agendado' | 'antecipado' | 'pago'
export type CommissionType = 'percent' | 'fixed'
export type CashflowType = 'entrada' | 'saida'
export type UserRole = 'owner' | 'admin' | 'attendant'

// ============ DATABASE TYPES ============
export interface Profile {
  id: string
  email: string
  full_name: string | null
  name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Settings {
  id: string
  user_id: string
  meta_tax_multiplier: number
  meta_tax_percent: number
  timezone: string
  currency: string
}

export interface AdAccount {
  id: string
  user_id: string
  meta_account_id: string
  name: string | null
  account_name: string | null
  access_token: string
  business_id: string | null
  business_name: string | null
  oauth_connected: boolean
  active: boolean
  last_sync_at: string | null
  created_at: string
}

export interface AdInsight {
  id: string
  user_id: string
  ad_account_id: string
  campaign_name: string | null
  adset_name: string | null
  ad_name: string | null
  spend: number
  spend_with_tax: number
  insight_date: string
}

export interface Webhook {
  id: string
  user_id: string
  token: string
  name: string | null
  label: string | null
  sale_type: SaleType
  active: boolean
  last_received_at: string | null
  total_received: number
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  webhook_id: string | null
  trans_key: string
  product_name: string | null
  plan_name: string | null
  trans_status: string | null
  trans_status_code: number | null
  custom_status: string | null
  trans_total_value: number
  commission_value: number
  sale_type: SaleType
  payment_method: number | null
  trans_installments: number
  is_cod: boolean
  trans_payment_date: string | null
  trans_create_date: string | null
  paid_at: string | null
  order_date: string | null
  src: string | null
  utm_campaign: string | null
  tracking_code: string | null
  delivery_status: string | null
  is_delivered: boolean
  client_name: string | null
  client_city: string | null
  client_state: string | null
  is_real_frustration: boolean
  include_in_calc: boolean
  is_manual: boolean
  created_at: string
  updated_at: string
}

export interface TransactionLog {
  id: string
  user_id: string
  trans_key: string | null
  postback_type: string | null
  raw_payload: Record<string, unknown>
  processed: boolean
  created_at: string
}

export interface Attendant {
  id: string
  user_id: string
  name: string
  src_key: string
  commission_type: CommissionType
  commission_value: number
  bonus: number
  active: boolean
  created_at: string
  rules?: AttendantRule[]
}

export interface AttendantRule {
  id: string
  attendant_id: string
  min_sales: number
  max_sales: number | null
  commission_type: CommissionType
  commission_value: number
  bonus_value: number
}

export interface AttendantEntry {
  id: string
  user_id: string
  attendant_id: string | null
  sigla: string | null
  kit: string | null
  sale_type: SaleType
  quantity: number
  entry_date: string
  notes: string | null
  created_at: string
}

export interface BankAccount {
  id: string
  user_id: string
  name: string
  bank: string | null
  balance: number
  color: string
  active: boolean
  updated_at: string
  created_at: string
}

export interface Cashflow {
  id: string
  user_id: string
  type: CashflowType
  category: string
  description: string
  amount: number
  reference_date: string
  payment_method: string | null
  bank_account_id: string | null
  is_auto: boolean
  notes: string | null
  created_at: string
}

export interface ManualEntry {
  id: string
  user_id: string
  sale_type: SaleType
  amount: number
  commission_amount: number
  src: string | null
  kit: string | null
  description: string | null
  entry_date: string
  include_in_calc: boolean
  created_at: string
}

// ============ API RESPONSE TYPES ============
export interface DashboardMetrics {
  agendadas_count: number
  antecipadas_count: number
  pagas_count: number
  comissao_real: number
  comissao_projetada: number
  valor_a_receber: number
  investimento_sem_imposto: number
  investimento_com_imposto: number
  cac: number
  frustradas_count: number
  frustration_rate: number
  total_transactions: number
}

export interface DailyData {
  date: string
  commission: number
  spend: number
  sales: number
  agendadas: number
  pagas: number
}

export interface CampaignData {
  name: string
  spend: number
  commission: number
  sales: number
}

export interface AttendantData {
  src: string
  commission: number
  sales: number
  scheduled: number
}

// ============ UI TYPES ============
export type DatePreset = 'hoje' | '7d' | '14d' | '30d' | 'custom'

export interface DateRange {
  from: Date
  to: Date
}

// ============ CONSTANTS ============
export const STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  1:  { label: 'Pendente',      color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  2:  { label: 'Pago',          color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  3:  { label: 'Cancelado',     color: 'text-red-400',     bg: 'bg-red-400/10' },
  4:  { label: 'Chargeback',    color: 'text-red-500',     bg: 'bg-red-500/10' },
  5:  { label: 'Devolvido',     color: 'text-orange-400',  bg: 'bg-orange-400/10' },
  6:  { label: 'Em Análise',    color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  7:  { label: 'Est. Pendente', color: 'text-purple-400',  bg: 'bg-purple-400/10' },
  8:  { label: 'Processando',   color: 'text-cyan-400',    bg: 'bg-cyan-400/10' },
  9:  { label: 'Parcial',       color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
  10: { label: 'Atrasado',      color: 'text-orange-500',  bg: 'bg-orange-500/10' },
  11: { label: 'Agendado',      color: 'text-brand',       bg: 'bg-brand/10' },
  12: { label: 'Frustrado',     color: 'text-red-400',     bg: 'bg-red-400/10' },
}

export const PAYMENT_MAP: Record<number, string> = {
  1: 'Boleto', 2: 'Cartão', 3: 'Boleto Parc.', 4: 'Grátis',
  5: 'Pix', 6: 'Na Entrega', 7: 'Cash Delivery', 8: 'Cartão+Pix', 9: 'Cartão+Boleto',
}

export const CASHFLOW_CATEGORIES = {
  saida: ['anuncios', 'atendentes', 'ferramentas', 'impostos', 'pro_labore', 'frete', 'produto', 'outro'],
  entrada: ['venda', 'comissao', 'reembolso', 'antecipado', 'outro'],
} as const

export const KIT_OPTIONS = ['2_meses', '3_meses', '5_meses', '12_meses', 'outro'] as const
