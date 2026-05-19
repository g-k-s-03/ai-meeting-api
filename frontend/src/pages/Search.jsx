import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'

function debounce(fn, ms) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}

function formatDate(str) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(str))
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const toast = useToast()
  const navigate = useNavigate()

  const doSearch = useCallback(
    debounce(async q => {
      if (!q.trim()) { setResults([]); setSearched(false); return }
      setLoading(true)
      try {
        const { data } = await api.get('/meetings/search/', { params: { q } })
        setResults(data)
        setSearched(true)
      } catch {
        toast('Search failed', 'error')
      } finally {
        setLoading(false)
      }
    }, 450),
    []
  )

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    doSearch(q)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Search</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Search across transcripts, summaries, and keywords
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <svg
          className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search meetings..."
          autoFocus
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && searched && (
        <p className="text-zinc-600 text-xs mb-3">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-10 h-10 mx-auto mb-3 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-zinc-500 text-sm">No meetings found</p>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(m => (
            <div
              key={m.id}
              onClick={() => navigate(`/meetings/${m.id}`)}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-zinc-500 text-xs">{formatDate(m.created_at)}</span>
                <StatusBadge status={m.status} />
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-2 group-hover:text-zinc-100 transition-colors">
                {m.summary
                  ? m.summary.slice(0, 140) + (m.summary.length > 140 ? '…' : '')
                  : 'No summary available'}
              </p>
              {m.keywords && (
                <p className="text-zinc-600 text-xs truncate">{m.keywords.slice(0, 90)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty (not yet searched) */}
      {!query && !loading && (
        <div className="text-center py-16 text-zinc-600 text-sm">
          Start typing to search your meetings
        </div>
      )}
    </div>
  )
}
