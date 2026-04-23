import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computePositionsAlongPolyline } from '../utils/routing'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createTextIcon(content, color, fontSize) {
  const isEmoji = /\p{Emoji}/u.test(content)
  const html = `
    <div style="
      font-size: ${isEmoji ? fontSize + 8 : fontSize}px;
      color: ${color};
      white-space: nowrap;
      text-shadow: 0 0 8px ${color}88, 1px 1px 0 #000, -1px -1px 0 #000;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      pointer-events: auto;
      user-select: none;
      transform: translateX(-50%);
      display: inline-block;
    ">${content}</div>
  `
  return L.divIcon({ html, className: '', iconAnchor: [0, 0] })
}

function createWaypointIcon(index) {
  return L.divIcon({
    html: `<div style="
      width: 20px; height: 20px; border-radius: 50%;
      background: #0066ff; border: 2px solid white;
      box-shadow: 0 0 8px rgba(0,102,255,0.7);
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; color: white; font-weight: bold;
      font-family: 'Space Mono', monospace;
      line-height: 1;
    ">${index + 1}</div>`,
    className: '',
    iconAnchor: [10, 10],
  })
}

function FlyToPosition({ position }) {
  const map = useMap()
  const initialRef = useRef(false)
  useEffect(() => {
    if (!position) return
    if (!initialRef.current) {
      map.setView([position.lat, position.lng], 16)
      initialRef.current = true
    }
  }, [position, map])
  return null
}

function LocationMarker({ position }) {
  if (!position) return null
  const icon = L.divIcon({
    html: `
      <div style="
        width:16px; height:16px; border-radius:50%;
        background:#0066ff; border:3px solid white;
        box-shadow:0 0 0 4px rgba(0,102,255,0.25), 0 2px 8px rgba(0,0,0,0.5);
        position:relative;
      "></div>
    `,
    className: '',
    iconAnchor: [8, 8],
  })
  return <Marker position={[position.lat, position.lng]} icon={icon} />
}

function MapClickHandler({ routeMode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (routeMode && onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    }
  })
  return null
}

export default function MapCanvas({
  position,
  layers,
  onMapClick,
  routeMode,
  routeWaypoints,
  routePreview,
  routeLoading,
}) {
  const defaultCenter = [35.6812, 139.7671]

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

      <FlyToPosition position={position} />
      <LocationMarker position={position} />
      <MapClickHandler routeMode={routeMode} onMapClick={onMapClick} />

      {routePreview?.length > 1 && (
        <Polyline
          positions={routePreview.map(p => [p.lat, p.lng])}
          pathOptions={{
            color: '#0066ff',
            weight: 3,
            opacity: routeLoading ? 0.4 : 0.85,
            dashArray: '8 6',
            lineCap: 'round',
          }}
        />
      )}

      {routeWaypoints?.map((wp, i) => (
        <Marker
          key={`wp-${i}`}
          position={[wp.lat, wp.lng]}
          icon={createWaypointIcon(i)}
        />
      ))}

      {layers.map((layer) => {
        if (layer.mode === 'stamp') {
          return (
            <Marker
              key={layer.id}
              position={[layer.lat, layer.lng]}
              icon={createTextIcon(layer.content, layer.color, layer.fontSize)}
            />
          )
        }

        if (layer.mode === 'track' && layer.points?.length > 1) {
          const latlngs = layer.points.map(p => [p.lat, p.lng])
          return (
            <React.Fragment key={layer.id}>
              <Polyline
                positions={latlngs}
                pathOptions={{
                  color: layer.color,
                  weight: layer.fontSize / 6,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {(() => {
                const mid = latlngs[Math.floor(latlngs.length / 2)]
                return <Marker key={layer.id + '_mid'} position={mid} icon={createTextIcon(layer.content, layer.color, layer.fontSize)} />
              })()}
            </React.Fragment>
          )
        }

        if (layer.mode === 'route' && layer.routePoints?.length > 1) {
          const spacingMeters = layer.fontSize * 3
          const textPositions = computePositionsAlongPolyline(layer.routePoints, spacingMeters)
          const finalPositions = textPositions.length > 0
            ? textPositions
            : [layer.routePoints[Math.floor(layer.routePoints.length / 2)]]
          const icon = createTextIcon(layer.content, layer.color, layer.fontSize)
          return (
            <React.Fragment key={layer.id}>
              <Polyline
                positions={layer.routePoints.map(p => [p.lat, p.lng])}
                pathOptions={{ color: layer.color, weight: 1.5, opacity: 0.3, lineCap: 'round' }}
              />
              {finalPositions.map((pos, i) => (
                <Marker
                  key={`${layer.id}_t${i}`}
                  position={[pos.lat, pos.lng]}
                  icon={icon}
                />
              ))}
            </React.Fragment>
          )
        }

        return null
      })}
    </MapContainer>
  )
}
