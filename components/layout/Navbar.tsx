'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Dumbbell, Bell, User, LogOut, Menu, X, MessageCircle } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; nickname?: string } | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('nickname')
          .eq('id', authUser.id)
          .single()
        setUser({ email: authUser.email, nickname: data?.nickname })
      }
    }

    const fetchUnread = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('is_read', false)
      setUnreadCount(count ?? 0)
    }

    fetchUser()
    fetchUnread()

    // Realtime subscription for notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/contest', label: '공모전', icon: Trophy },
    { href: '/sports', label: '스포츠', icon: Dumbbell },
    { href: '/messages', label: '메시지', icon: MessageCircle },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-border bg-surface-card/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary-600/30 border border-primary-500/30 flex items-center justify-center group-hover:bg-primary-600/50 transition-colors">
              <span className="text-sm">🎯</span>
            </div>
            <span className="font-bold text-white hidden sm:block">충북대 매칭</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  pathname.startsWith(href)
                    ? 'bg-primary-600/20 text-primary-300 border border-primary-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              href="/notifications"
              id="nav-notifications"
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-all duration-200"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <Link
              href="/profile"
              id="nav-profile"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                pathname === '/profile'
                  ? 'bg-primary-600/20 text-primary-300'
                  : 'text-gray-400 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:block">{user?.nickname ?? '프로필'}</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              id="nav-logout"
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-border py-3 space-y-1 animate-fade-in">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  pathname.startsWith(href)
                    ? 'bg-primary-600/20 text-primary-300'
                    : 'text-gray-400 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
