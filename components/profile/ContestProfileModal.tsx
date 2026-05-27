'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ContestField, CONTEST_FIELD_LABELS } from '@/types/database'
import { X, Plus, Loader2, Save } from 'lucide-react'

interface ContestProfileModalProps {
  onClose: () => void
}

const ALL_FIELDS = Object.entries(CONTEST_FIELD_LABELS) as [ContestField, string][]

export default function ContestProfileModal({ onClose }: ContestProfileModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [certInput, setCertInput] = useState('')

  const [form, setForm] = useState({
    department: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    age: '',
    contest_count: '',
    certificates: [] as string[],
    fields: [] as ContestField[],
    intro: '',
    is_visible: true,
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('contest_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setForm({
          department: data.department || '',
          gender: data.gender || '',
          age: data.age?.toString() || '',
          contest_count: data.contest_count?.toString() || '0',
          certificates: data.certificates || [],
          fields: data.fields || [],
          intro: data.intro || '',
          is_visible: data.is_visible,
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const addCert = () => {
    const trimmed = certInput.trim()
    if (!trimmed || form.certificates.length >= 10) return
    if (form.certificates.includes(trimmed)) return
    setForm((p) => ({ ...p, certificates: [...p.certificates, trimmed] }))
    setCertInput('')
  }

  const removeCert = (cert: string) => {
    setForm((p) => ({ ...p, certificates: p.certificates.filter((c) => c !== cert) }))
  }

  const toggleField = (field: ContestField) => {
    setForm((p) => ({
      ...p,
      fields: p.fields.includes(field)
        ? p.fields.filter((f) => f !== field)
        : [...p.fields, field],
    }))
  }

  const handleSave = async () => {
    if (!form.department) { alert('학과를 입력해주세요.'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      department: form.department,
      gender: form.gender || null,
      age: form.age ? parseInt(form.age) : null,
      contest_count: parseInt(form.contest_count) || 0,
      certificates: form.certificates,
      fields: form.fields,
      intro: form.intro || null,
      is_visible: form.is_visible,
    }

    await supabase.from('contest_profiles').upsert(payload, { onConflict: 'user_id' })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border sticky top-0 bg-surface-elevated/95 backdrop-blur-sm rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">공모전 프로필</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-border transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                학과 <span className="text-red-400">*</span>
              </label>
              <input
                id="cp-department"
                type="text"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="예: 컴퓨터공학과"
                className="input-base"
              />
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">성별</label>
                <select
                  id="cp-gender"
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as any }))}
                  className="input-base"
                >
                  <option value="">선택 안함</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">나이</label>
                <input
                  id="cp-age"
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                  placeholder="예: 23"
                  min={18} max={40}
                  className="input-base"
                />
              </div>
            </div>

            {/* Contest count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">공모전 참여 횟수</label>
              <input
                id="cp-contest-count"
                type="number"
                value={form.contest_count}
                onChange={(e) => setForm((p) => ({ ...p, contest_count: e.target.value }))}
                placeholder="0"
                min={0}
                className="input-base"
              />
            </div>

            {/* Certificates */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                자격증 <span className="text-gray-500 font-normal">({form.certificates.length}/10)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="cp-cert-input"
                  type="text"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCert())}
                  placeholder="자격증명 입력 후 Enter"
                  className="input-base flex-1"
                />
                <button onClick={addCert} className="btn-secondary px-3" type="button">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.certificates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.certificates.map((cert) => (
                    <span key={cert} className="badge-primary flex items-center gap-1">
                      {cert}
                      <button onClick={() => removeCert(cert)} className="ml-1 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">관심 분야 (복수 선택)</label>
              <div className="flex flex-wrap gap-2">
                {ALL_FIELDS.map(([value, label]) => (
                  <button
                    key={value}
                    id={`cp-field-${value}`}
                    type="button"
                    onClick={() => toggleField(value)}
                    className={`badge cursor-pointer transition-all duration-200 ${
                      form.fields.includes(value)
                        ? 'bg-primary-700/80 text-primary-200 border border-primary-500/50'
                        : 'bg-surface-border text-gray-400 border border-transparent hover:border-primary-600/30'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Intro */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                자기소개 <span className="text-gray-500 font-normal">({form.intro.length}/300자)</span>
              </label>
              <textarea
                id="cp-intro"
                value={form.intro}
                onChange={(e) => setForm((p) => ({ ...p, intro: e.target.value.slice(0, 300) }))}
                placeholder="공모전 참여 경험, 강점, 원하는 팀 스타일 등을 적어주세요"
                rows={4}
                className="input-base resize-none"
              />
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl border border-surface-border">
              <div>
                <p className="text-sm font-medium text-white">프로필 공개</p>
                <p className="text-xs text-gray-500 mt-0.5">비공개 시 다른 사용자에게 보이지 않습니다</p>
              </div>
              <button
                id="cp-visibility-toggle"
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_visible: !p.is_visible }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  form.is_visible ? 'bg-primary-600' : 'bg-surface-border'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  form.is_visible ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Save */}
            <button
              id="cp-save-btn"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
