import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'

const TABS = ['Overview', 'Transcript', 'Action Items', 'Decisions', 'Export']

function formatDate(str) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

function parseJSON(str) {
  try { return JSON.parse(str || '[]') } catch { return [] }
}

function splitList(str) {
  return str ? str.split(',').map(s => s.trim()).filter(Boolean) : []
}

export default function MeetingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')
  const [exporting, setExporting] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    fetchMeeting()
    return () => clearInterval(pollRef.current)
  }, [id])

  useEffect(() => {
    clearInterval(pollRef.current)
    if (meeting?.status === 'processing') {
      pollRef.current = setInterval(fetchMeeting, 6000)
    }
    return () => clearInterval(pollRef.current)
  }, [meeting?.status])

  async function fetchMeeting() {
    try {
      const { data } = await api.get(`/meetings/${id}`)
      setMeeting(data)
    } catch {
      toast('Meeting not found', 'error')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(format) {
    setExporting(format)
    try {
      const { data } = await api.get(`/meetings/${id}/export/${format}`, {
        responseType: format === 'txt' ? 'text' : 'json',
      })
      const content = format === 'json' ? JSON.stringify(data, null, 2) : data
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meeting-${id.slice(0, 8)}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast(`Downloaded as ${format.toUpperCase()}`, 'success')
    } catch {
      toast('Export failed', 'error')
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }
  if (!meeting) return null

  const actionItems = parseJSON(meeting.action_items)
  const decisions = splitList(meeting.decisions)
  const keywords = splitList(meeting.keywords)
  const isComplete = meeting.status === 'completed'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </button>

      {/* Header card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <StatusBadge status={meeting.status} />
          {meeting.status === 'processing' && (
            <span className="text-zinc-500 text-xs flex items-center gap-1.5">
              <Spinner size="sm" /> AI is analyzing...
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs font-mono mb-1">{meeting.id}</p>
        <p className="text-zinc-600 text-xs">{formatDate(meeting.created_at)}</p>

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {keywords.map(kw => (
              <span
                key={kw}
                className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs px-2.5 py-1 rounded-full"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

        {tab === 'Overview' && (
          <div>
            <h3 className="text-zinc-300 font-medium mb-3">Summary</h3>
            {meeting.summary ? (
              <p className="text-zinc-400 text-sm leading-relaxed">{meeting.summary}</p>
            ) : (
              <p className="text-zinc-600 text-sm">
                {meeting.status === 'processing'
                  ? 'Summary will appear once analysis is complete.'
                  : 'No summary available.'}
              </p>
            )}
          </div>
        )}

        {tab === 'Transcript' && (
          <div>
            <h3 className="text-zinc-300 font-medium mb-3">Full Transcript</h3>
            {meeting.transcript ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                <p className="text-zinc-400 text-sm leading-7 whitespace-pre-wrap font-mono">
                  {meeting.transcript}
                </p>
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">
                {meeting.status === 'processing'
                  ? 'Transcript will appear once transcription is complete.'
                  : 'No transcript available.'}
              </p>
            )}
          </div>
        )}

        {tab === 'Action Items' && (
          <div>
            <h3 className="text-zinc-300 font-medium mb-3">
              Action Items{actionItems.length > 0 && <span className="text-zinc-500 font-normal ml-2">({actionItems.length})</span>}
            </h3>
            {actionItems.length > 0 ? (
              <div className="space-y-3">
                {actionItems.map((item, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-200 text-sm font-medium mb-2">{item.task}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      {item.owner && item.owner !== 'unknown' && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {item.owner}
                        </span>
                      )}
                      {item.deadline && item.deadline !== 'unknown' && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {item.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">
                {meeting.status === 'processing'
                  ? 'Action items will appear once analysis is complete.'
                  : 'No action items found.'}
              </p>
            )}
          </div>
        )}

        {tab === 'Decisions' && (
          <div>
            <h3 className="text-zinc-300 font-medium mb-3">
              Decisions Made{decisions.length > 0 && <span className="text-zinc-500 font-normal ml-2">({decisions.length})</span>}
            </h3>
            {decisions.length > 0 ? (
              <div className="space-y-2">
                {decisions.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed">{d}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">
                {meeting.status === 'processing'
                  ? 'Decisions will appear once analysis is complete.'
                  : 'No decisions recorded.'}
              </p>
            )}
          </div>
        )}

        {tab === 'Export' && (
          <div>
            <h3 className="text-zinc-300 font-medium mb-1">Export Report</h3>
            <p className="text-zinc-500 text-sm mb-6">Download the full meeting data as a file.</p>
            {!isComplete && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-lg mb-5">
                Export is available once the meeting finishes processing.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { format: 'json', label: 'Export as JSON', sub: 'Structured data for developers', color: 'text-amber-400 bg-amber-500/10' },
                { format: 'txt', label: 'Export as TXT', sub: 'Human-readable meeting report', color: 'text-blue-400 bg-blue-500/10' },
              ].map(({ format, label, sub, color }) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  disabled={exporting !== null || !isComplete}
                  className="flex items-center gap-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-xl p-5 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <span className="text-xs font-bold uppercase">{format}</span>
                  </div>
                  <div>
                    <p className="text-zinc-200 text-sm font-medium flex items-center gap-2">
                      {label}
                      {exporting === format && <Spinner size="sm" />}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
