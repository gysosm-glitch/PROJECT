'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FacilityGroup, FACILITY_GROUP_LABELS } from '@/types/database'
import { X, Loader2, Save } from 'lucide-react'

interface SportsProfileModalProps {
  onClose: () => void
}

const ALL_SPORTS = Object.entries(FACILITY_GROUP_LABELS) as [FacilityGroup, string][]

export default function SportsProfileModal({ onClose }: SportsProfileModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    gender: '' as 'male' | 'female' | 'other' | '',
    age: '',
    sports: [] as string[],
    career_years: '',
    is_pro: false,
    intro: '',
    is_visible: true,
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('sports_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setForm({
          gender: data.gender || '',
          age: data.age?.toString() || '',
          sports: data.sports || [],
          career_years: data.career_years?.toString() || '0',
          is_pro: data.is_pro || false,
          intro: data.intro || '',
          is_visible: data.is_visible,
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const toggleSport = (sport: string) => {
    setForm((p) => ({
      ...p,
      sports: p.sports.includes(sport)
        ? p.sports.filter((s) => s !== sport)
        : [...p.sports, sport],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      gender: form.gender || null,
      age: form.age ? parseInt(form.age) : null,
      sports: form.sports,
      career_years: parseInt(form.career_years) || 0,
      is_pro: form.is_pro,
      intro: form.intro || null,
      is_visible: form.is_visible,
    }

    await supabase.from('sports_profiles').upsert(payload, { onConflict: 'user_id' })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border sticky top-0 bg-surface-elevated/95 backdrop-blur-sm rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-white">스포츠 프로필</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-border transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">성별</label>
                <select
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
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                  placeholder="예: 23"
                  min={18} max={40}
                  className="input-base"
                />
              </div>
            </div>

            {/* Sports */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">관심 종목 (복수 선택)</label>
              <div className="flex flex-wrap gap-2">
                {ALL_SPORTS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleSport(value)}
                    className={`badge cursor-pointer transition-all duration-200 ${
                      form.sports.includes(value)
                        ? 'bg-accent-700/80 text-accent-200 border border-accent-500/50'
                        : 'bg-surface-border text-gray-400 border border-transparent hover:border-accent-600/30'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Career Years & Pro status */}
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">운동 경력 (년)</label>
                <input
                  type="number"
                  value={form.career_years}
                  onChange={(e) => setForm((p) => ({ ...p, career_years: e.target.value }))}
                  placeholder="0"
                  min={0}
                  className="input-base"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl border border-surface-border h-[42px]">
                <span className="text-sm font-medium text-white">선출 여부</span>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, is_pro: !p.is_pro }))}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    form.is_pro ? 'bg-accent-600' : 'bg-surface-border'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    form.is_pro ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Intro */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                자기소개 <span className="text-gray-500 font-normal">({form.intro.length}/300자)</span>
              </label>
              <textarea
                value={form.intro}
                onChange={(e) => setForm((p) => ({ ...p, intro: e.target.value.slice(0, 300) }))}
                placeholder="주로 플레이하는 포지션, 운동 스타일 등을 적어주세요"
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
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_visible: !p.is_visible }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  form.is_visible ? 'bg-accent-600' : 'bg-surface-border'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  form.is_visible ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl font-medium transition-colors"
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
