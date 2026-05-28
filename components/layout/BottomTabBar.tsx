'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Dumbbell, User } from 'lucide-react'

export default function BottomTabBar() {
  const pathname = usePathname()

  const navItems = [
    { name: '홈', href: '/', icon: Home },
    { name: '공모전', href: '/contest', icon: Trophy },
    { name: '스포츠', href: '/sports', icon: Dumbbell },
    { name: 'MY', href: '/profile', icon: User },
  ]

  return (
    <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-200 px-6 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-between items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors"
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
