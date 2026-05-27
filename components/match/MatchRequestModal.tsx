'use client'

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'

interface MatchRequestModalProps {
  onClose: () => void
  onSubmit: (message: string) => Promise<void>
  targetNickname: string
}

export default function MatchRequestModal({ onClose, onSubmit, targetNickname }: MatchRequestModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('매칭 신청 메시지를 입력해주세요.')
      return
    }
    setLoading(true)
    await onSubmit(message.trim())
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card-elevated w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 className="text-lg font-bold text-white">매칭 신청</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-border transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-gray-300 text-sm mb-4">
            <strong className="text-white">{targetNickname}</strong>님에게 보낼 메시지를 작성해주세요.
            자신을 간단히 소개하고 연락처(이메일, 카카오톡 등)를 남기는 것이 좋습니다.
          </p>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="함께하고 싶습니다! 제 연락처는..."
            rows={5}
            className="input-base resize-none mb-2"
          />
          <div className="text-right text-xs text-gray-500 mb-5">
            {message.length} / 200자
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? '전송 중...' : '신청하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
