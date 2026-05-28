'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, Search, Plus, X } from 'lucide-react'

interface MessageRoom {
  id: string
  match_id: string | null
  is_group: boolean
  created_at: string
  last_message?: string
  last_message_at?: string
  other_user_nickname?: string
}

interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
}

export default function MessagesPage() {
  const supabase = createClient()
  const [rooms, setRooms] = useState<MessageRoom[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUser(user.id)
    }

    fetchUser()
  }, [supabase])

  useEffect(() => {
    if (!currentUser) return

    const fetchRooms = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('message_rooms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('메시지 방 조회 오류:', error)
      } else {
        setRooms(data as MessageRoom[])
      }
      setLoading(false)
    }

    fetchRooms()

    // Realtime subscription for new rooms
    const channel = supabase
      .channel('message_rooms_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_rooms' }, () => {
        fetchRooms()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUser, supabase])

  useEffect(() => {
    if (!selectedRoomId) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', selectedRoomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('메시지 조회 오류:', error)
      } else {
        setMessages(data as Message[])
      }
    }

    fetchMessages()

    // Realtime subscription for messages
    const channel = supabase
      .channel(`messages_${selectedRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoomId}` }, () => {
        fetchMessages()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedRoomId, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedRoomId || !currentUser) return

    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: selectedRoomId,
        sender_id: currentUser,
        content: messageInput,
      })

    if (error) {
      console.error('메시지 전송 오류:', error)
    } else {
      setMessageInput('')
    }
  }

  const filteredRooms = rooms.filter(room =>
    room.other_user_nickname?.toLowerCase().includes(searchInput.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-5 h-5 text-accent-400" />
        <h1 className="text-xl font-bold text-white">메시지</h1>
      </div>

      {/* Main Chat Layout */}
      <div className="grid md:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
        {/* Room List */}
        <div className="md:col-span-1 glass-card flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-surface-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="검색..."
                className="input-base pl-10 text-sm"
              />
            </div>
          </div>

          {/* Room List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-elevated">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-surface-elevated animate-pulse rounded" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <p>아직 메시지가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedRoomId === room.id
                        ? 'bg-accent-600/20 border border-accent-500/30'
                        : 'hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{room.other_user_nickname || '채팅방'}</div>
                    {room.is_group && <div className="text-xs text-gray-500 mt-1">그룹 채팅</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-3 glass-card flex flex-col overflow-hidden">
          {selectedRoomId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-surface-elevated">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.sender_id === currentUser
                          ? 'bg-primary-600 text-white rounded-br-none'
                          : 'bg-surface-elevated text-gray-300 rounded-bl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-border flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="input-base flex-1"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="btn-primary flex items-center justify-center w-10 h-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">메시지를 선택해주세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
