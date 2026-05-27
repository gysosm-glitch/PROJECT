'use client'

import { useState } from 'react'
import { resolveReport, unbanUser } from '@/app/actions/admin'
import { Loader2, CheckCircle, Ban, AlertCircle, UserCheck } from 'lucide-react'

export default function AdminReportList({ reports }: { reports: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAction = async (reportId: string, action: 'ban' | 'dismiss', reportedId?: string) => {
    if (!confirm(action === 'ban' ? '이 사용자를 정지(Ban)하시겠습니까?' : '이 신고를 무시(Dismiss)하시겠습니까?')) return
    
    setLoadingId(reportId)
    const res = await resolveReport(reportId, action, reportedId)
    if (res.error) alert(res.error)
    setLoadingId(null)
  }

  const handleUnban = async (userId: string, reportId: string) => {
    if (!confirm('이 사용자의 정지를 해제하시겠습니까?')) return
    
    setLoadingId(reportId)
    const res = await unbanUser(userId)
    if (res.error) alert(res.error)
    setLoadingId(null)
  }

  if (reports.length === 0) {
    return <p className="text-gray-400">신고 내역이 없습니다.</p>
  }

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-xs text-gray-400 bg-surface-hover/50 uppercase">
            <tr>
              <th className="px-6 py-4">신고자</th>
              <th className="px-6 py-4">피신고자</th>
              <th className="px-6 py-4">사유</th>
              <th className="px-6 py-4">상세내용</th>
              <th className="px-6 py-4">상태</th>
              <th className="px-6 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-surface-border hover:bg-surface-hover/30">
                <td className="px-6 py-4 whitespace-nowrap">
                  {report.reporter?.nickname} <br/>
                  <span className="text-xs text-gray-500">{report.reporter?.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    {report.reported?.nickname}
                    {!report.reported?.is_active && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">BANNED</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 block mt-1">{report.reported?.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-medium">
                    {report.reason}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs truncate" title={report.detail}>
                  {report.detail || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {report.status === 'pending' && <span className="text-yellow-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> 대기중</span>}
                  {report.status === 'resolved' && <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 처리완료(Ban)</span>}
                  {report.status === 'dismissed' && <span className="text-gray-500 flex items-center gap-1"><Ban className="w-3 h-3"/> 무시됨</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  {loadingId === report.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400 inline-block" />
                  ) : (
                    <>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(report.id, 'ban', report.reported?.id)}
                            className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                          >
                            정지(Ban)
                          </button>
                          <button
                            onClick={() => handleAction(report.id, 'dismiss')}
                            className="px-3 py-1.5 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 rounded-md transition-colors"
                          >
                            무시
                          </button>
                        </>
                      )}
                      
                      {report.status !== 'pending' && !report.reported?.is_active && (
                        <button
                          onClick={() => handleUnban(report.reported?.id, report.id)}
                          className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-md transition-colors flex items-center gap-1 ml-auto"
                        >
                          <UserCheck className="w-3 h-3" /> 정지 해제
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
