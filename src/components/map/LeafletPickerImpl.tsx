import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { Crosshair, MapPin, Search } from 'lucide-react'
import { Button } from '../ui/Button'

// Fix the well-known default-marker-icon path bug under Vite/bundlers.
// Without this the marker icon comes up as a broken image.
const DEFAULT_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DEFAULT_ICON

const KATHMANDU: [number, number] = [27.7172, 85.324]
// Loose Nepal bounding box used to bias Nominatim search.
const NEPAL_VIEWBOX = '80.0884,30.4227,88.1748,26.347' // left,top,right,bottom

type SearchResult = {
  display_name: string
  lat: string
  lon: string
}

type Props = {
  initialLat?: number | null
  initialLng?: number | null
  onChange: (lat: number, lng: number, address?: string) => void
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const last = useRef<[number, number] | null>(null)
  useEffect(() => {
    const prev = last.current
    if (!prev || prev[0] !== lat || prev[1] !== lng) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14))
      last.current = [lat, lng]
    }
  }, [lat, lng, map])
  return null
}

export default function LeafletPickerImpl({
  initialLat,
  initialLng,
  onChange,
}: Props) {
  // Defensive: lat/lng may arrive as strings from DB-backed loaders. Coerce
  // to numbers before the Number.isFinite guard so we don't silently fall back
  // to KATHMANDU and overwrite a real location on save.
  const lat = initialLat == null ? null : Number(initialLat)
  const lng = initialLng == null ? null : Number(initialLng)
  const hasInitial =
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)

  const initial: [number, number] = useMemo(() => {
    if (hasInitial) return [lat as number, lng as number]
    return KATHMANDU
  }, [hasInitial, lat, lng])
  const [position, setPosition] = useState<[number, number] | null>(
    hasInitial ? initial : null,
  )
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const debounceRef = useRef<number | null>(null)

  function commit(lat: number, lng: number, address?: string) {
    setPosition([lat, lng])
    onChange(lat, lng, address)
  }

  // Reverse-geocode to suggest an address on drop.
  async function reverseGeocode(lat: number, lng: number) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=0`
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return
      const data = (await res.json()) as { display_name?: string }
      if (data.display_name) {
        onChange(lat, lng, data.display_name)
      }
    } catch {
      // Ignore reverse-geocode failures — coords are already committed.
    }
  }

  function handlePick(lat: number, lng: number) {
    commit(lat, lng)
    void reverseGeocode(lat, lng)
  }

  // Debounced address search via Nominatim, biased to Nepal.
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      return
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=np&viewbox=${NEPAL_VIEWBOX}&bounded=0&q=${encodeURIComponent(
          q,
        )}`
        const res = await fetch(url, {
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error('search failed')
        const data = (await res.json()) as SearchResult[]
        setResults(data)
        setResultsOpen(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleUseMyLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not available in this browser')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude, longitude } = pos.coords
        handlePick(latitude, longitude)
      },
      (err) => {
        setLocating(false)
        setError(err.message || 'Could not get your location')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-3)]"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setResultsOpen(true)}
            placeholder="Search address (Nepal)…"
            className="w-full squircle border border-[var(--color-line)] bg-[var(--color-canvas)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-ink)] focus:outline-none"
          />
          {resultsOpen && results.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-[1100] mt-1 max-h-64 overflow-auto squircle border border-[var(--color-line)] bg-[var(--color-canvas)] shadow-md">
              {results.map((r) => (
                <button
                  key={`${r.lat},${r.lon},${r.display_name}`}
                  type="button"
                  onClick={() => {
                    const lat = Number(r.lat)
                    const lng = Number(r.lon)
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                      commit(lat, lng, r.display_name)
                      setResultsOpen(false)
                      setQuery(r.display_name)
                    }
                  }}
                  className="block w-full border-b border-[var(--color-line)] px-3 py-2 text-left text-xs text-[var(--color-ink)] last:border-b-0 hover:bg-[var(--color-canvas-2)]"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleUseMyLocation}
          disabled={locating}
          leftIcon={<Crosshair className="h-4 w-4" />}
        >
          {locating ? 'Locating…' : 'My location'}
        </Button>
      </div>

      {searching ? (
        <div className="text-xs text-[var(--color-ink-3)]">Searching…</div>
      ) : null}
      {error ? (
        <div className="text-xs text-[var(--color-danger)]">{error}</div>
      ) : null}

      <div className="overflow-hidden squircle border border-[var(--color-line)]">
        <MapContainer
          center={position ?? initial}
          zoom={position ? 15 : 12}
          style={{ height: 320, width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position ? <Recenter lat={position[0]} lng={position[1]} /> : null}
          <ClickHandler onPick={handlePick} />
          {position ? (
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker
                  const ll = m.getLatLng()
                  handlePick(ll.lat, ll.lng)
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-ink-3)]">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {position
            ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
            : 'Click the map or search to pick a location'}
        </span>
        <span>Map data © OpenStreetMap</span>
      </div>
    </div>
  )
}
