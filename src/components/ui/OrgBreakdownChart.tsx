type Slice = {
  label: string
  value: number
  color: string
}

type Props = {
  slices: Slice[]
  total?: number
  centerLabel?: string
}

export function OrgBreakdownChart({ slices, total, centerLabel }: Props) {
  const sum = slices.reduce((acc, s) => acc + s.value, 0)
  const effectiveTotal = total ?? sum
  const size = 180
  const stroke = 26
  const radius = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const arcs = slices.map((s, i) => {
    const fraction = sum > 0 ? s.value / sum : 0
    const dash = circumference * fraction
    const gap = circumference - dash
    const dashOffset = -offset
    offset += dash
    return {
      key: `${s.label}-${i}`,
      color: s.color,
      strokeDasharray: `${dash} ${gap}`,
      strokeDashoffset: dashOffset,
    }
  })

  const hasData = sum > 0

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative flex-shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-label="Organization breakdown chart"
          role="img"
        >
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={stroke}
          />
          {hasData
            ? arcs.map((a) => (
                <circle
                  key={a.key}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={stroke}
                  strokeDasharray={a.strokeDasharray}
                  strokeDashoffset={a.strokeDashoffset}
                  strokeLinecap="butt"
                />
              ))
            : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-3xl font-semibold leading-none tabular-nums tracking-tight text-[var(--color-ink)]">
            {effectiveTotal}
          </div>
          {centerLabel ? (
            <div className="tiny-cap mt-1 text-[var(--color-ink-3)]">
              {centerLabel}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-2.5">
        {slices.map((s) => {
          const pct = sum > 0 ? Math.round((s.value / sum) * 100) : 0
          return (
            <div key={s.label} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className="h-2.5 w-2.5 flex-shrink-0 squircle"
                style={{ backgroundColor: s.color }}
              />
              <span className="flex-1 text-[var(--color-ink-2)]">
                {s.label}
              </span>
              <span className="tabular-nums font-medium text-[var(--color-ink)]">
                {s.value}
              </span>
              <span className="w-10 text-right tabular-nums text-xs text-[var(--color-ink-3)]">
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
