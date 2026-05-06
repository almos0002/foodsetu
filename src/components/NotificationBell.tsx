import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, BellRing } from 'lucide-react'
import { getNotificationsFn } from '../lib/notifications-server'
import type { NotificationItem } from '../lib/notifications-server'
import { cn } from './ui/cn'

const POLL_MS = 60_000

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const sec = Math.max(1, Math.floor((now - then) / 1000))
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const wrapperRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await getNotificationsFn()
      setItems(res.items)
    } catch {
      // Silently swallow — bell stays at 0; non-critical.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = window.setInterval(load, POLL_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const count = items.length
  const hasUnread = count > 0

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications (${count})`}
        aria-expanded={open}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center squircle border transition-colors',
          hasUnread
            ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'border-[var(--color-line)] text-[var(--color-ink-2)] hover:bg-[var(--color-canvas-2)]',
        )}
      >
        {hasUnread ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center squircle bg-[var(--color-accent)] px-1 text-[10px] font-semibold leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 squircle border border-[var(--color-line-strong)] bg-[var(--color-canvas)] sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">
                Notifications
              </div>
              <div className="text-xs text-[var(--color-ink-3)]">
                {hasUnread
                  ? `${count} item${count === 1 ? '' : 's'} need attention`
                  : 'All caught up'}
              </div>
            </div>
            <button
              type="button"
              onClick={load}
              className="text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              Refresh
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-ink-3)]">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-ink-3)]">
                Nothing pending right now.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-line)]">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 transition-colors hover:bg-[var(--color-canvas-2)]"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          aria-hidden
                          className={cn(
                            'mt-1 h-2 w-2 flex-shrink-0 squircle',
                            item.kind === 'warning'
                              ? 'bg-[var(--color-warn)]'
                              : item.kind === 'action'
                                ? 'bg-[var(--color-accent)]'
                                : 'bg-[var(--color-ink-3)]',
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[var(--color-ink)]">
                            {item.title}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-[var(--color-ink-2)]">
                            {item.message}
                          </div>
                          <div className="mt-1 text-[11px] text-[var(--color-ink-3)]">
                            {timeAgo(item.createdAt)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
