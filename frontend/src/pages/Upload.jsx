import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'

const ALLOWED_MIME = new Set([
  'audio/mpeg', 'audio/wav', 'audio/mp4',
  'audio/x-m4a', 'video/mp4', 'video/webm',
])
const MAX_BYTES = 100 * 1024 * 1024

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Upload() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const inputRef = useRef(null)
  const toast = useToast()
  const navigate = useNavigate()

  function validate(f) {
    if (!ALLOWED_MIME.has(f.type)) return 'Unsupported file type. Use MP3, WAV, M4A, MP4, or WebM.'
    if (f.size > MAX_BYTES) return 'File exceeds 100 MB limit.'
    return null
  }

  function pickFile(f) {
    const err = validate(f)
    if (err) { setError(err); setFile(null) }
    else { setError(''); setFile(f) }
  }

  const onDrop = useCallback(e => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }, [])

  const onDragOver = useCallback(e => { e.preventDefault(); setIsDragging(true) }, [])
  const onDragLeave = useCallback(() => setIsDragging(false), [])

  async function handleUpload() {
    if (!file || uploading) return
    setUploading(true)
    setProgress(0)
    setError('')

    const form = new FormData()
    form.append('file', file)

    try {
      const { data } = await api.post('/meetings/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded / e.total) * 100)),
      })
      toast('Upload complete! AI is analyzing your recording.', 'success')
      navigate(`/meetings/${data.id}`)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-100">Upload Recording</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Upload an audio or video file to transcribe and analyze with AI
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !file && !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-14 text-center transition-all ${
          isDragging
            ? 'border-violet-500 bg-violet-500/5 scale-[1.01]'
            : file
            ? 'border-zinc-700 bg-zinc-900/40 cursor-default'
            : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/40 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.mp4,.webm"
          className="hidden"
          onChange={e => e.target.files[0] && pickFile(e.target.files[0])}
        />

        {file ? (
          <div>
            <div className="w-14 h-14 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-zinc-200 font-medium text-sm">{file.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{formatSize(file.size)}</p>
            {!uploading && (
              <button
                onClick={e => { e.stopPropagation(); setFile(null); setError('') }}
                className="mt-3 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
              >
                Remove file
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${isDragging ? 'bg-violet-600/20' : 'bg-zinc-800'}`}>
              <svg className={`w-7 h-7 transition-colors ${isDragging ? 'text-violet-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-zinc-300 font-medium text-sm mb-1">
              {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-zinc-500 text-sm">
              or{' '}
              <span className="text-violet-400 hover:text-violet-300 cursor-pointer transition-colors">
                browse to choose
              </span>
            </p>
            <p className="text-zinc-600 text-xs mt-3">MP3, WAV, M4A, MP4, WebM — max 100 MB</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-400 mb-2">
            <span>Uploading to Supabase...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {uploading ? (
            <>
              <Spinner size="sm" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload & Analyze
            </>
          )}
        </button>
        {file && !uploading && (
          <button
            onClick={() => { setFile(null); setError('') }}
            className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-zinc-300 text-sm font-medium mb-3">What happens next?</h3>
        <div className="space-y-3">
          {[
            ['Transcription', 'AssemblyAI converts your audio to text'],
            ['Analysis', 'Groq LLaMA extracts a summary, keywords, action items, and decisions'],
            ['Results', 'View everything in the meeting detail page'],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              </div>
              <p className="text-sm">
                <span className="text-zinc-300 font-medium">{title}</span>
                <span className="text-zinc-500"> — {desc}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
