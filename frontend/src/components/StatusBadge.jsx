const config = {
  uploaded: {
    label: 'Uploaded',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  processing: {
    label: 'Processing',
    dot: 'bg-amber-400 animate-pulse',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-red-400',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
}

export default function StatusBadge({ status }) {
  const cfg = config[status] ?? config.uploaded
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
