'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import type { Attendant, AttendantRule, CommissionType } from '@/types'

type FormType = { name: string; src_key: string; commission_type: CommissionType; commission_value: number; bonus: number }
type RuleForm = { min_sales: number; max_sales: number | null; commission_type: CommissionType; commission_value: number; bonus_value: number }

const EMPTY_FORM: FormType = { name: '', src_key: '', commission_type: 'percent', commission_value: 0, bonus: 0 }
const EMPTY_RULE: RuleForm = { min_sales: 0, max_sales: null, commission_type: 'percent', commission_value: 0, bonus_value: 0 }

export default function AttendantsPage() {
  const supabase = createClient()
  const [attendants, setAttendants] = useState<Attendant[]>([])
  const [rules, setRules] = useState<Record<string, AttendantRule[]>>({})
  const [form, setForm] = useState<FormType>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [ruleFor, setRuleFor] = useState<string | null>(null)
  const [ruleForm, setRuleForm] = useState<RuleForm>(EMPTY_RULE)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: att } = await supabase.from('attendants').select('*').order('name')
    setAttendants(att ?? [])
    if (att && att.length > 0) {
      const { data: r } = await supabase.from('attendant_rules').select('*').in('attendant_id', att.map(a => a.id))
      const grouped: Record<string, AttendantRule[]> = {}
      for (const rule of r ?? []) {
        if (!grouped[rule.attendant_id]) grouped[rule.attendant_id] = []
        grouped[rule.attendant_id].push(rule)
      }
      setRules(grouped)
    }
  }

  async function save() {
    if (!form.name || !form.src_key) return toast.error('Nome e Chave (src) são obrigatórios')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...form, user_id: user!.id }
    const { error } = editId
      ? await supabase.from('attendants').update(form).eq('id', editId)
      : await supabase.from('attendants').insert(payload)
    if (error) toast.error(error.message)
    else { toast.success(editId ? 'Atualizada!' : 'Cadastrada!'); setForm(EMPTY_FORM); setEditId(null); setShowForm(false) }
    setLoading(false)
    await load()
  }

  async function saveRule(attendantId: string) {
    const { error } = await supabase.from('attendant_rules').insert({ ...ruleForm, attendant_id: attendantId })
    if (error) toast.error(error.message)
    else { toast.success('Meta adicionada!'); setRuleForm(EMPTY_RULE); setRuleFor(null) }
    await load()
  }

  async function deleteRule(id: string) {
    await supabase.from('attendant_rules').delete().eq('id', id)
    toast.success('Meta removida')
    await load()
  }

  async function toggle(id: string, active: boolean) {
    await supabase.from('attendants').update({ active: !active }).eq('id', id)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Remover atendente?')) return
    await supabase.from('attendants').delete().eq('id', id)
    toast.success('Removida')
    await load()
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 className="display" style={{ fontWeight:800, fontSize:24, letterSpacing:'-0.02em' }}>Atendentes</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Gerencie equipe, comissões e metas progressivas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }}>+ Nova Atendente</button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card" style={{ padding:24, marginBottom:20 }}>
          <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>{editId ? 'Editar' : 'Nova'} Atendente</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Nome *</label>
              <input className="input" placeholder="Bruna Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>
                Chave src * <span style={{ color:'var(--brand)', fontSize:11 }}>(igual ao link: src=Bruna)</span>
              </label>
              <input className="input" placeholder="Bruna" value={form.src_key} onChange={e => setForm(f => ({ ...f, src_key: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Tipo de comissão padrão</label>
              <select className="input" value={form.commission_type} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value as CommissionType }))}>
                <option value="percent">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>{form.commission_type === 'percent' ? 'Comissão (%)' : 'Comissão (R$)'}</label>
              <input className="input" type="number" step="0.01" value={form.commission_value} onChange={e => setForm(f => ({ ...f, commission_value: parseFloat(e.target.value)||0 }))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--dim)', display:'block', marginBottom:5 }}>Bônus fixo (R$)</label>
              <input className="input" type="number" step="0.01" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: parseFloat(e.target.value)||0 }))} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Salvando...' : editId ? 'Salvar' : 'Cadastrar'}</button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {attendants.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>👥</div>
          <p style={{ color:'var(--muted)' }}>Nenhuma atendente cadastrada</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {attendants.map(att => (
            <div key={att.id} className="card" style={{ overflow:'hidden' }}>
              <div style={{ padding:'18px 22px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--brand-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, color:'var(--brand)', flexShrink:0 }}>
                  {att.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700 }}>{att.name}</div>
                  <div style={{ display:'flex', gap:10, marginTop:3 }}>
                    <code style={{ fontSize:11, background:'var(--brand-dim)', color:'var(--brand-l)', padding:'2px 7px', borderRadius:5 }}>src={att.src_key}</code>
                    <span style={{ fontSize:12, color:'var(--muted)' }}>
                      {att.commission_type === 'percent' ? `${att.commission_value}%` : formatCurrency(att.commission_value)} comissão
                    </span>
                    {att.bonus > 0 && <span style={{ fontSize:12, color:'var(--success)' }}>+ {formatCurrency(att.bonus)} bônus</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span className="badge" style={{ color: att.active ? 'var(--success)' : 'var(--danger)', background: att.active ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', fontSize:11 }}>
                    {att.active ? 'Ativa' : 'Inativa'}
                  </span>
                  <button onClick={() => { setForm({ name:att.name, src_key:att.src_key, commission_type:att.commission_type, commission_value:att.commission_value, bonus:att.bonus }); setEditId(att.id); setShowForm(true) }} className="btn btn-ghost" style={{ padding:'5px 11px', fontSize:12 }}>Editar</button>
                  <button onClick={() => toggle(att.id, att.active)} className="btn btn-ghost" style={{ padding:'5px 11px', fontSize:12 }}>{att.active ? 'Pausar' : 'Ativar'}</button>
                  <button onClick={() => setRuleFor(ruleFor === att.id ? null : att.id)} className="btn btn-ghost" style={{ padding:'5px 11px', fontSize:12 }}>🎯 Metas</button>
                  <button onClick={() => remove(att.id)} className="btn btn-danger" style={{ padding:'5px 11px', fontSize:12 }}>Remover</button>
                </div>
              </div>

              {/* Metas progressivas */}
              {ruleFor === att.id && (
                <div style={{ borderTop:'1px solid var(--border)', padding:'16px 22px', background:'rgba(255,255,255,0.015)' }}>
                  <h4 style={{ fontSize:13, fontWeight:700, marginBottom:14, color:'var(--muted)' }}>🎯 Metas Progressivas</h4>

                  {/* Regras existentes */}
                  {(rules[att.id] ?? []).length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                      {(rules[att.id] ?? []).sort((a, b) => a.min_sales - b.min_sales).map(rule => (
                        <div key={rule.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 12px', background:'rgba(97,114,243,0.07)', borderRadius:9 }}>
                          <span style={{ fontSize:12, color:'var(--muted)' }}>
                            {rule.min_sales}–{rule.max_sales ?? '∞'} vendas
                          </span>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--brand-l)' }}>
                            {rule.commission_type === 'percent' ? `${rule.commission_value}%` : formatCurrency(rule.commission_value)}
                          </span>
                          {rule.bonus_value > 0 && <span style={{ fontSize:12, color:'var(--success)' }}>+ {formatCurrency(rule.bonus_value)} bônus</span>}
                          <button onClick={() => deleteRule(rule.id)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--danger)', fontSize:16, padding:'0 4px' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar meta */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, alignItems:'end' }}>
                    <div>
                      <label style={{ fontSize:11, color:'var(--dim)', display:'block', marginBottom:4 }}>De (vendas)</label>
                      <input className="input" type="number" value={ruleForm.min_sales} onChange={e => setRuleForm(f => ({ ...f, min_sales: parseInt(e.target.value)||0 }))} />
                    </div>
                    <div>
                      <label style={{ fontSize:11, color:'var(--dim)', display:'block', marginBottom:4 }}>Até (vendas)</label>
                      <input className="input" type="number" placeholder="∞" value={ruleForm.max_sales ?? ''} onChange={e => setRuleForm(f => ({ ...f, max_sales: e.target.value ? parseInt(e.target.value) : null }))} />
                    </div>
                    <div>
                      <label style={{ fontSize:11, color:'var(--dim)', display:'block', marginBottom:4 }}>Tipo</label>
                      <select className="input" value={ruleForm.commission_type} onChange={e => setRuleForm(f => ({ ...f, commission_type: e.target.value as CommissionType }))}>
                        <option value="percent">%</option>
                        <option value="fixed">R$</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:11, color:'var(--dim)', display:'block', marginBottom:4 }}>Comissão</label>
                      <input className="input" type="number" step="0.01" value={ruleForm.commission_value} onChange={e => setRuleForm(f => ({ ...f, commission_value: parseFloat(e.target.value)||0 }))} />
                    </div>
                    <button className="btn btn-primary" onClick={() => saveRule(att.id)} style={{ justifyContent:'center' }}>+ Adicionar</button>
                  </div>

                  <p style={{ fontSize:11, color:'var(--dim)', marginTop:10 }}>
                    Exemplo: 0–10 vendas → 5% | 11–20 → 7% | 21+ → 10% + bônus R$200
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
