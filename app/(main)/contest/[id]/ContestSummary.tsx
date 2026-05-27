'use client'

import { useState } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { summarizeContest } from '@/app/actions/claude'

interface ContestSummaryProps {
  content: string
}

export default function ContestSummary({ content }: ContestSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSummarize = async () => {
    setLoading(true)
    setError(null)
    const res = await summarizeContest(content)
    if (res.error) {
      setError(res.error)
    } else if (res.summary) {
      setSummary(res.summary)
    }
    setLoading(false)
  }

  if (summary) {
    return (
      <div className="glass-card overflow-hidden border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)] mb-8">
        <div className="bg-indigo-900/20 p-4 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Sparkles className="w-5 h-5" />
            AI 공모전 요약
          </div>
          <button
            onClick={handleSummarize}
            disabled={loading}
            className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            다시 요약
          </button>
        </div>
        <div className="p-5 text-indigo-100 text-sm leading-relaxed whitespace-pre-wrap">
          {summary}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center text-center mb-8 border-dashed border-indigo-500/30">
      <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
        <Sparkles className="w-6 h-6 text-indigo-400" />
      </div>
      <h3 className="text-white font-medium mb-2">공모전 내용이 너무 길다면?</h3>
      <p className="text-sm text-gray-400 mb-4">
        Claude AI가 참가 자격, 혜택, 핵심 주제를 3줄로 요약해드립니다.
      </p>
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="btn-primary bg-indigo-600 hover:bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'AI가 요약 중입니다...' : 'AI 3줄 요약 보기'}
      </button>
      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
    </div>
  )
}
