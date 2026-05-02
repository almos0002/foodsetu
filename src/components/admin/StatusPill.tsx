type Props = {
  label: string
  className?: string
}

export function StatusPill({ label, className }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        className ??
        'border-[var(--color-line)] bg-[var(--color-canvas-2)] text-[var(--color-ink-2)]'
      }`}
    >
      {label}
    </span>
  )
}
