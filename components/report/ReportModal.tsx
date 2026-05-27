'use client'

import { useState } from 'react'
import { X, Send, AlertTriangle, Loader2 } from 'lucide-react'

interface ReportModalProps {
  onClose: () => void
  onSubmit: (reason: string, detail: string) => Promise<void>
  targetNickname: string
}

const REPORT_REASONS = [
  '욕설/비방',
  '광고/스팸',
  '노쇼/비매너',
  '불쾌감 조성',
  '기타'
]

export default function ReportModal({ onClose, onSubmit, targetNickname }: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return
    setLoading(true)
    await onSubmit(reason, detail.trim())
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card-elevated w-full max-w-md animate-slide-up border-red-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">사용자 신고</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-border transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-gray-300 text-sm mb-5">
            <strong className="text-white">{targetNickname}</strong>님을 신고하시겠습니까?
            허위 신고 시 서비스 이용에 제한이 있을 수 있습니다.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">신고 사유</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-base"
              >
                {REPORT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">상세 내용 (선택)</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="신고 내용을 자세히 적어주시면 관리에 도움이 됩니다."
                rows={4}
                className="input-base resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? '신고 중...' : '신고하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
