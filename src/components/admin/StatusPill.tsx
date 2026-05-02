type Props = {
  label: string
  className?: string
}

export function StatusPill({ label, className }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-[1.5px] px-2 py-0.5 text-xs font-bold ${
        className ??
        'border-[var(--color-line-strong)] bg-[var(--color-cream)] text-[var(--color-ink-2)]'
      }`}
    >
      {label}
    </span>
  )
}
