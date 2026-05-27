import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CONTEST_FIELD_LABELS, ContestField } from '@/types/database'
import { Calendar, Building2, ExternalLink, Trophy, Users, ArrowLeft } from 'lucide-react'
import MatchUserList from './MatchUserList'

interface ContestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContestDetailPage({ params }: ContestDetailPageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 1. Fetch contest
  const { data: contest } = await supabase
    .from('contests')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!contest) {
    notFound()
  }

  // 2. Fetch current user
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Back button */}
      <Link href="/contest" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        목록으로 돌아가기
      </Link>

      {/* Contest Details Card */}
      <div className="glass-card overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          <div className="w-full md:w-1/3 h-64 md:h-auto relative bg-surface-elevated border-b md:border-b-0 md:border-r border-surface-border">
            {contest.thumbnail_url ? (
              <img
                src={contest.thumbnail_url}
                alt={contest.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900/60 to-surface-elevated">
                <Trophy className="w-16 h-16 text-primary-600/50" />
              </div>
            )}
            <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400">
                  {CONTEST_FIELD_LABELS[contest.field as ContestField] || '기타'}
                </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
              {contest.title}
            </h1>
            
            <div className="space-y-4 mb-8">
              {contest.organizer && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">주최</p>
                    <p className="text-white font-medium">{contest.organizer}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">접수 기간</p>
                  <p className="text-white font-medium">
                    {contest.start_date ? `${contest.start_date} ~ ` : '마감일: '}
                    <span className="text-red-400">{contest.end_date}</span>
                  </p>
                </div>
              </div>
              {contest.prize && (
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-accent-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">시상 내역</p>
                    <p className="text-white font-medium">{contest.prize}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                상세정보 보기 <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="#match-section"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" /> 팀원 구하기
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Match Section */}
      <div id="match-section" className="pt-8 scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-primary-400" />
          <h2 className="text-2xl font-bold text-white">함께할 팀원 찾기</h2>
        </div>
        <p className="text-gray-400 mb-6">
          이 공모전 분야({CONTEST_FIELD_LABELS[contest.field as ContestField] || '기타'})에 관심 있는 학우들입니다.
        </p>

        {/* Client component for match users list */}
        <MatchUserList contestId={contest.id} field={contest.field} currentUserId={user?.id} />
      </div>
    </div>
  )
}
