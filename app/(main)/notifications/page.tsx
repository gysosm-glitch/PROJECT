'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCircle2, MessageSquare, XCircle, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

type NotificationItem = {
  id: string
  type: 'match_request' | 'match_accepted' | 'match_rejected'
  content: string
  is_read: boolean
  related_id: string | null
  created_at: string
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setNotifications(data as NotificationItem[])
      }
      setLoading(false)
    }

    fetchNotifications()
  }, [supabase])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'match_request': return <MessageSquare className="w-5 h-5 text-primary-400" />
      case 'match_accepted': return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'match_rejected': return <XCircle className="w-5 h-5 text-red-400" />
      default: return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">알림</h1>
          <p className="text-gray-400 text-sm">새로운 매칭 요청과 결과를 확인하세요.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card text-center py-20">
          <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">새로운 알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              className={`glass-card p-4 sm:p-5 flex gap-4 transition-all duration-200 cursor-pointer hover:border-primary-500/30 ${
                notif.is_read ? 'opacity-70' : 'bg-primary-900/10 border-primary-500/30 shadow-lg shadow-primary-900/10'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <p className={`text-sm sm:text-base ${notif.is_read ? 'text-gray-300' : 'text-white font-medium'}`}>
                  {notif.content}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(notif.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {/* Link to matches page if it's a match-related notification */}
                  <Link href="/matches" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                    매칭 관리 가기
                  </Link>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                className="shrink-0 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors h-fit opacity-0 group-hover:opacity-100 sm:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
