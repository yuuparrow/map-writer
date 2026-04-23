import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap, Marker, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function FlyToPosition({ position }) {
  const map = useMap()
  const initialRef = useRef(false)
  useEffect(() => {
    if (!position || initialRef.current) return
    map.setView([position.lat, position.lng], 16)
    initialRef.current = true
  }, [position, map])
  return null
}

function FlyToRoute({ plannedRoute }) {
  const map = useMap()
  const doneRef = useRef(false)
  useEffect(() => {
    if (!plannedRoute?.length || doneRef.current) return
    const lats = plannedRoute.map(p => p.lat)
    const lngs = plannedRoute.map(p => p.lng)
    const bounds = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]
    map.fitBounds(bounds, { padding: [40, 40] })
    doneRef.current = true
  }, [plannedRoute, map])
  return null
}

function CurrentPositionMarker({ position }) {
  if (!position) return null
  const icon = L.divIcon({
    html: `<div style="
      width:16px; height:16px; border-radius:50%;
      background:#0066ff; border:3px solid white;
      box-shadow:0 0 0 4px rgba(0,102,255,0.25), 0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    className: '',
    iconAnchor: [8, 8],
  })
  return <Marker position={[position.lat, position.lng]} icon={icon} />
}

export default function MapCanvas({
  position,
  appMode,
  plannedRoute,
  waypointIdx,
  gpsTrace,
}) {
  const defaultCenter = [35.6812, 139.7671]
  const currentTarget = plannedRoute?.[waypointIdx]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      {appMode === 'design' && <FlyToPosition position={position} />}
      {(appMode === 'preview') && plannedRoute?.length > 0 && (
        <FlyToRoute plannedRoute={plannedRoute} />
      )}

      {/* Planned route: faint dots */}
      {plannedRoute?.length > 0 && (appMode === 'preview' || appMode === 'navigating') && (
        plannedRoute.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={3}
            pathOptions={{
              color: 'rgba(255,255,255,0.25)',
              fillColor: 'rgba(255,255,255,0.15)',
              fillOpacity: 1,
              weight: 0,
            }}
          />
        ))
      )}

      {/* GPS trace: the actual walked path */}
      {gpsTrace?.length > 1 && (
        <Polyline
          positions={gpsTrace.map(p => [p.lat, p.lng])}
          pathOptions={{ color: '#ff3d00', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
        />
      )}

      {/* Completed trace highlight */}
      {appMode === 'complete' && gpsTrace?.length > 1 && (
        <Polyline
          positions={gpsTrace.map(p => [p.lat, p.lng])}
          pathOptions={{ color: '#ffea00', weight: 6, opacity: 0.5, lineCap: 'round' }}
        />
      )}

      {/* Current navigation target: pulsing circle */}
      {appMode === 'navigating' && currentTarget && (
        <CircleMarker
          center={[currentTarget.lat, currentTarget.lng]}
          radius={12}
          pathOptions={{ color: '#ff3d00', fillColor: '#ff3d00', fillOpacity: 0.35, weight: 2 }}
        />
      )}

      <CurrentPositionMarker position={position} />
    </MapContainer>
  )
}
