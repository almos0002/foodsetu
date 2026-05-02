import { Suspense, lazy, useEffect, useState } from 'react'
import type { ListingsMapMarker } from './ListingsMapImpl'

const ListingsMapImpl = lazy(() => import('./ListingsMapImpl'))

export type { ListingsMapMarker } from './ListingsMapImpl'

type Props = {
  origin: { latitude: number; longitude: number }
  markers: ListingsMapMarker[]
  radiusKm?: number
  height?: number
}

function MapSkeleton({ height = 460 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-2)] text-xs text-[var(--color-ink-3)]"
      style={{ height }}
    >
      Loading map…
    </div>
  )
}

export function ListingsMap(props: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <MapSkeleton height={props.height} />
  return (
    <Suspense fallback={<MapSkeleton height={props.height} />}>
      <ListingsMapImpl {...props} />
    </Suspense>
  )
}
