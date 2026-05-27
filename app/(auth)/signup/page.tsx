'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

type Step = 'form' | 'success'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    studentId: '',
  })

  const supabase = createClient()

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  const validate = () => {
    if (!form.email.endsWith('@chungbuk.ac.kr')) {
      return '충북대학교 이메일(@chungbuk.ac.kr)만 가입 가능합니다.'
    }
    if (form.password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.'
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(form.password)) {
      return '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'
    }
    if (form.password !== form.confirmPassword) {
      return '비밀번호가 일치하지 않습니다.'
    }
    if (form.nickname.length < 2 || form.nickname.length > 10) {
      return '닉네임은 2~10자 사이여야 합니다.'
    }
    if (!/^\d{10}$/.test(form.studentId)) {
      return '학번은 10자리 숫자여야 합니다.'
    }
    return null
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          nickname: form.nickname,
          student_id: form.studentId,
        },
      },
    })

    if (authError) {
      if (authError.message.includes('User already registered')) {
        setError('이미 사용 중인 이메일입니다.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
      setLoading(false)
      return
    }

    // Insert user profile
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: form.email,
        nickname: form.nickname,
        student_id: form.studentId,
      })
    }

    setStep('success')
    setLoading(false)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md glass-card p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600/20 border border-green-500/30 mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">인증 메일을 발송했습니다!</h2>
          <p className="text-gray-400 text-sm mb-2">
            <span className="text-white font-medium">{form.email}</span>으로
          </p>
          <p className="text-gray-400 text-sm mb-6">
            인증 링크를 보내드렸습니다. 메일함을 확인하고 링크를 클릭해주세요.
          </p>
          <button onClick={() => router.push('/login')} className="btn-primary w-full">
            로그인 페이지로 이동
          </button>
          <p className="text-gray-600 text-xs mt-4">스팸 메일함도 확인해보세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-white">회원가입</h1>
          <p className="text-gray-400 mt-1 text-sm">충북대 이메일로 가입하세요</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-900/30 border border-red-700/50 rounded-xl animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                충북대 이메일 <span className="text-red-400">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="학번@chungbuk.ac.kr"
                className="input-base"
                required
              />
              {form.email && !form.email.endsWith('@chungbuk.ac.kr') && (
                <p className="text-red-400 text-xs mt-1">@chungbuk.ac.kr 이메일만 가능합니다</p>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                닉네임 <span className="text-red-400">*</span>
                <span className="text-gray-500 font-normal ml-1">(2~10자, 중복 불가)</span>
              </label>
              <input
                id="nickname"
                type="text"
                value={form.nickname}
                onChange={update('nickname')}
                placeholder="닉네임 입력"
                className="input-base"
                maxLength={10}
                required
              />
            </div>

            {/* Student ID */}
            <div>
              <label htmlFor="student-id" className="block text-sm font-medium text-gray-300 mb-2">
                학번 <span className="text-red-400">*</span>
                <span className="text-gray-500 font-normal ml-1">(10자리 숫자)</span>
              </label>
              <input
                id="student-id"
                type="text"
                value={form.studentId}
                onChange={update('studentId')}
                placeholder="2024000000"
                className="input-base"
                maxLength={10}
                pattern="\d{10}"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 <span className="text-red-400">*</span>
                <span className="text-gray-500 font-normal ml-1">(8자↑, 영문+숫자+특수문자)</span>
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="비밀번호 입력"
                  className="input-base pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 확인 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  placeholder="비밀번호 재입력"
                  className="input-base pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  회원가입
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
