import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'

function formatDate(str) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(str))
}

function getFileName(filePath) {
  if (!filePath) return 'Recording'
  const name = filePath.split('/').pop() ?? ''
  // Strip UUID prefix (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  return name.replace(/^[0-9a-f-]{36}/, 'recording') || 'Recording'
}

export default function Dashboard() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => { fetchMeetings() }, [])

  async function fetchMeetings() {
    try {
      const { data } = await api.get('/meetings/')
      setMeetings([...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch {
      toast('Failed to load meetings', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, e) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Delete this meeting? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await api.delete(`/meetings/${id}`)
      setMeetings(prev => prev.filter(m => m.id !== id))
      toast('Meeting deleted', 'success')
    } catch {
      toast('Failed to delete meeting', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">My Meetings</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {meetings.length} recording{meetings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/upload"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload
        </Link>
      </div>

      {/* Empty state */}
      {meetings.length === 0 && (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-zinc-300 font-medium mb-1.5">No meetings yet</h3>
          <p className="text-zinc-500 text-sm mb-6">Upload your first recording to get started</p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Upload a recording
          </Link>
        </div>
      )}

      {/* Grid */}
      {meetings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map(meeting => (
            <div
              key={meeting.id}
              onClick={() => navigate(`/meetings/${meeting.id}`)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group relative"
            >
              {/* File icon + name + badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <span className="text-zinc-300 text-sm font-medium truncate">
                    {getFileName(meeting.file_path)}
                  </span>
                </div>
                <StatusBadge status={meeting.status} />
              </div>

              {/* Summary preview */}
              <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
                {meeting.summary
                  ? meeting.summary
                  : meeting.status === 'processing'
                  ? 'Analyzing your recording...'
                  : 'No summary available yet.'}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 text-xs">{formatDate(meeting.created_at)}</span>
                <button
                  onClick={e => handleDelete(meeting.id, e)}
                  disabled={deletingId === meeting.id}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1 rounded disabled:opacity-40"
                  aria-label="Delete meeting"
                >
                  {deletingId === meeting.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
