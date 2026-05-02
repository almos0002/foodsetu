type Props = {
  label: string
  className?: string
}

export function StatusPill({ label, className }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        className ?? 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
      }`}
    >
      {label}
    </span>
  )
}
