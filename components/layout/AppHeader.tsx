'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, Bell } from 'lucide-react'
import Link from 'next/link'

export default function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()

  // 경로에 따른 헤더 타이틀 매핑
  const getTitle = () => {
    if (pathname === '/') return '충북대 매칭 플랫폼'
    if (pathname?.startsWith('/contest')) return '공모전 파티'
    if (pathname?.startsWith('/sports')) return '스포츠 매칭'
    if (pathname?.startsWith('/profile')) return '내 프로필'
    if (pathname?.startsWith('/recruitment/create')) return '팀원 모집 개설'
    if (pathname?.startsWith('/recruitment')) return '모집 방 상세'
    return ''
  }

  // 메인 탭 화면인지 여부 (메인 탭에서는 뒤로가기 숨김)
  const isMainTab = ['/', '/contest', '/sports', '/profile'].includes(pathname || '')

  return (
    <div className="sticky top-0 w-full max-w-[480px] h-14 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 z-50">
      <div className="flex-1 flex items-center justify-start">
        {!isMainTab && (
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-[#191919]" />
          </button>
        )}
      </div>
      
      <div className="flex-1 flex justify-center">
        <h1 className="text-lg font-bold text-[#191919]">
          {getTitle()}
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-end">
        <Link href="/notifications" className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors relative">
          <Bell className="w-5 h-5 text-[#191919]" />
          {/* 가짜 알림 배지 (디자인용) */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </Link>
      </div>
    </div>
  )
}
