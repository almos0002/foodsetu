import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { Link } from '@tanstack/react-router'
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import {
  formatDistance,
  formatTime,
} from '../ui/FoodListingCard'

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

const ORIGIN_ICON = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#0a7a3f;border:2px solid #fff;box-shadow:0 0 0 2px #0a7a3f;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export type ListingsMapMarker = {
  id: string
  title: string
  latitude: number
  longitude: number
  distanceKm?: number | null
  expiryTime: string
  pickupStartTime?: string
  pickupEndTime?: string
  detailHref?: string
}

type Props = {
  origin: { latitude: number; longitude: number }
  markers: ListingsMapMarker[]
  radiusKm?: number
  height?: number
}

function FitBounds({
  origin,
  markers,
}: {
  origin: { latitude: number; longitude: number }
  markers: ListingsMapMarker[]
}) {
  const map = useMap()
  useEffect(() => {
    const points: [number, number][] = [
      [origin.latitude, origin.longitude],
      ...markers.map(
        (m) => [m.latitude, m.longitude] as [number, number],
      ),
    ]
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [origin.latitude, origin.longitude, markers, map])
  return null
}

export default function ListingsMapImpl({
  origin,
  markers,
  radiusKm,
  height = 460,
}: Props) {
  const center: [number, number] = useMemo(
    () => [origin.latitude, origin.longitude],
    [origin.latitude, origin.longitude],
  )
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-line)]">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height, width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds origin={origin} markers={markers} />
        <Marker position={center} icon={ORIGIN_ICON}>
          <Popup>You are here</Popup>
        </Marker>
        {radiusKm ? (
          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#0a7a3f',
              weight: 1,
              fillOpacity: 0.05,
            }}
          />
        ) : null}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {m.title}
                </div>
                {m.distanceKm != null ? (
                  <div style={{ fontSize: 12, color: '#525252' }}>
                    {formatDistance(m.distanceKm)} away
                  </div>
                ) : null}
                <div style={{ fontSize: 12, color: '#525252' }}>
                  Expires {formatTime(m.expiryTime)}
                </div>
                {m.detailHref ? (
                  <div style={{ marginTop: 6 }}>
                    <Link
                      to={m.detailHref}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#0a7a3f',
                      }}
                    >
                      View details →
                    </Link>
                  </div>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
