'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage, User } from '@/types/database'
import { Send, Loader2 } from 'lucide-react'

interface RoomChatProps {
  roomId: string
  currentUser: User
}

interface MessageWithUser extends ChatMessage {
  sender: {
    nickname: string
    avatar_url: string | null
  }
}

export default function RoomChat({ roomId, currentUser }: RoomChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<MessageWithUser[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!sender_id ( nickname, avatar_url )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data as any)
      }
      setLoading(false)
      scrollToBottom()
    }

    fetchMessages()

    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload: any) => {
          const { data: userData } = await supabase
            .from('users')
            .select('nickname, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          const newMsg: MessageWithUser = {
            ...(payload.new as ChatMessage),
            sender: userData || { nickname: '알 수 없음', avatar_url: null }
          }

          setMessages(prev => [...prev, newMsg])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: currentUser.id,
        content: newMessage.trim()
      })

    if (error) {
      console.error('Error sending message:', error)
      alert('메시지 전송에 실패했습니다.')
    } else {
      setNewMessage('')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface-elevated rounded-2xl border border-surface-border">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl border border-surface-border shadow-sm overflow-hidden mt-8">
      {/* Header */}
      <div className="p-4 border-b border-surface-border bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          💬 모집방 채팅
        </h3>
        <span className="text-xs text-slate-500">방 참여자 전용</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <p>아직 메시지가 없습니다.</p>
            <p className="text-sm mt-1">첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-xs text-slate-500 mb-1 ml-1">{msg.sender.nickname}</span>
                  )}
                  <div className={`px-4 py-2 rounded-2xl ${
                    isMe 
                      ? 'bg-primary-500 text-white rounded-br-sm' 
                      : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 mx-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-surface-border bg-white flex items-end gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e)
            }
          }}
          placeholder="메시지를 입력하세요..."
          className="flex-1 input-base text-sm resize-none py-3"
          rows={1}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl disabled:opacity-50 transition-colors"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  )
}
