import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Dumbbell, ArrowRight, Users, Calendar, TrendingUp } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Stats
  const [{ count: activeContests }, { count: availableSlots }] = await Promise.all([
    supabase.from('contests').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('sports_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .gte('reservation_date', new Date().toISOString().split('T')[0]),
  ])

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden p-8 sm:p-12 bg-gradient-hero border border-primary-800/30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-900/60 border border-primary-700/40 rounded-full text-primary-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse" />
            충북대학교 재학생 전용 플랫폼
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            함께할 팀원 & 파트너를
            <br />
            <span className="gradient-text">스마트하게 찾으세요</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mb-8">
            공모전 팀원이 필요하거나, 스포츠 파트너를 찾고 있나요?
            능력 기반 매칭으로 최적의 사람을 연결해드립니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/contest" id="home-contest-btn" className="btn-primary flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              공모전 팀원 찾기
            </Link>
            <Link href="/sports" id="home-sports-btn" className="btn-secondary flex items-center justify-center gap-2">
              <Dumbbell className="w-5 h-5" />
              스포츠 파트너 찾기
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Trophy, value: activeContests ?? 0, label: '진행 중인 공모전', color: 'primary' },
          { icon: Calendar, value: availableSlots ?? 0, label: '예약 가능 슬롯', color: 'accent' },
          { icon: Users, value: '∞', label: '매칭 대기 중', color: 'green' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="glass-card p-4 sm:p-6 text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${
              color === 'primary' ? 'bg-primary-900/60' :
              color === 'accent' ? 'bg-accent-900/60' : 'bg-green-900/60'
            }`}>
              <Icon className={`w-5 h-5 ${
                color === 'primary' ? 'text-primary-400' :
                color === 'accent' ? 'text-accent-400' : 'text-green-400'
              }`} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contest Card */}
        <Link href="/contest" id="home-contest-card" className="group glass-card p-6 sm:p-8 hover:border-primary-500/40 transition-all duration-300 hover:glow-primary">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-900/60 border border-primary-700/30 group-hover:bg-primary-800/60 transition-colors">
              <Trophy className="w-7 h-7 text-primary-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-200" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">공모전 매칭</h2>
          <p className="text-gray-400 text-sm mb-6">
            마케팅, IT, 디자인 등 다양한 분야의 공모전 팀원을 찾아보세요.
            공모전 참여 횟수, 자격증, 관심 분야로 최적의 팀원을 매칭합니다.
          </p>

          <div className="flex flex-wrap gap-2">
            {['마케팅·아이디어', 'IT·소프트웨어', '디자인', '학술·창업'].map((tag) => (
              <span key={tag} className="badge-primary text-xs">{tag}</span>
            ))}
          </div>
        </Link>

        {/* Sports Card */}
        <Link href="/sports" id="home-sports-card" className="group glass-card p-6 sm:p-8 hover:border-accent-500/40 transition-all duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-900/60 border border-accent-700/30 group-hover:bg-accent-800/60 transition-colors">
              <Dumbbell className="w-7 h-7 text-accent-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-accent-400 group-hover:translate-x-1 transition-all duration-200" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">스포츠 매칭</h2>
          <p className="text-gray-400 text-sm mb-6">
            충북대 스포츠 시설 예약 현황을 실시간으로 확인하고,
            함께 운동할 파트너를 찾아보세요.
          </p>

          <div className="flex flex-wrap gap-2">
            {['풋살장', '농구장', '테니스장', '소운동장'].map((tag) => (
              <span key={tag} className="badge-accent text-xs">{tag}</span>
            ))}
          </div>
        </Link>
      </div>

      {/* How it works */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-bold text-white">이용 방법</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '01', title: '프로필 등록', desc: '학과, 경험, 관심 분야를 입력해 나만의 프로필을 만드세요' },
            { step: '02', title: '파트너 탐색', desc: '분야별 공모전이나 시설 예약 현황을 보고 원하는 파트너를 찾으세요' },
            { step: '03', title: '매칭 신청', desc: '메시지와 함께 매칭을 신청하고, 수락되면 이메일로 연락하세요' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="glass-card p-5 relative overflow-hidden">
              <div className="absolute -top-3 -right-3 text-6xl font-black text-primary-900/40 select-none">
                {step}
              </div>
              <div className="relative">
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
