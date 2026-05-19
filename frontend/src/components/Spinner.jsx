const sizes = {
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-2',
}

export default function Spinner({ size = 'md' }) {
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-zinc-700 border-t-violet-500`}
    />
  )
}
