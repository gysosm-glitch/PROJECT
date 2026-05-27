'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 도메인 검증
    if (!email.endsWith('@chungbuk.ac.kr')) {
      setError('충북대학교 이메일(@chungbuk.ac.kr)만 로그인 가능합니다.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        setError('이메일 인증을 완료해주세요. 받은 메일함을 확인하세요.')
      } else if (authError.message.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background blobs */}
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
          <h1 className="text-2xl font-bold text-white">충북대 매칭 플랫폼</h1>
          <p className="text-gray-400 mt-1 text-sm">공모전 팀원 & 스포츠 파트너 찾기</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">로그인</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-900/30 border border-red-700/50 rounded-xl animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                충북대 이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="학번@chungbuk.ac.kr"
                className="input-base"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="input-base pr-12"
                  required
                  autoComplete="current-password"
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

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-border bg-surface-elevated accent-primary-500"
                />
                <span className="text-sm text-gray-400">로그인 상태 유지</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                비밀번호 찾기
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  로그인
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-gray-400 text-sm mt-6">
            아직 계정이 없으신가요?{' '}
            <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              회원가입
            </Link>
          </p>
        </div>

        {/* Notice */}
        <p className="text-center text-gray-600 text-xs mt-4">
          충북대학교 재학생·휴학생만 이용 가능합니다
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center p-4 text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
