import { Suspense, lazy, useEffect, useState } from 'react'

const LeafletPickerImpl = lazy(() => import('./LeafletPickerImpl'))

type Props = {
  initialLat?: number | null
  initialLng?: number | null
  onChange: (lat: number, lng: number, address?: string) => void
}

function MapSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-2)]" />
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-2)] text-xs text-[var(--color-ink-3)]">
        Loading map…
      </div>
    </div>
  )
}

/**
 * Client-only wrapper around LeafletPickerImpl. We avoid SSR by gating the
 * lazy-loaded impl behind a `mounted` flag set in `useEffect`, so the heavy
 * leaflet/react-leaflet bundle never runs on the server.
 */
export function LocationPicker(props: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <MapSkeleton />
  return (
    <Suspense fallback={<MapSkeleton />}>
      <LeafletPickerImpl {...props} />
    </Suspense>
  )
}
