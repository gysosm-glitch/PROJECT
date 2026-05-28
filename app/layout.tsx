import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '충북대 매칭 플랫폼 | 공모전 & 스포츠 파트너 찾기',
  description:
    '충북대학교 재학생 전용 공모전 팀원 & 스포츠 파트너 매칭 플랫폼. 능력 기반 매칭으로 최적의 팀원을 찾아보세요.',
  keywords: ['충북대', '공모전', '스포츠', '매칭', '팀원 모집 개설하기', '파트너'],
  openGraph: {
    title: '충북대 매칭 플랫폼',
    description: '충북대 재학생 전용 공모전 & 스포츠 파트너 매칭',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen relative">
        <div className="bg-aurora" />
        {children}
      </body>
    </html>
  )
}
