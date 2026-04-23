function haversineDist(a, b) {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

function lerpPoint(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

export async function fetchOsrmRoute(waypoints) {
  const coordStr = waypoints.map(w => `${w.lng},${w.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found')
  return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
}

export function straightLinePoints(waypoints) {
  const result = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    result.push(waypoints[i])
    result.push(lerpPoint(waypoints[i], waypoints[i + 1], 0.5))
  }
  result.push(waypoints[waypoints.length - 1])
  return result
}

export function computePositionsAlongPolyline(points, spacingMeters) {
  if (points.length < 2) return points.slice()
  const result = []
  let accumulated = 0
  let emitNext = spacingMeters / 2

  for (let i = 0; i < points.length - 1; i++) {
    const segLen = haversineDist(points[i], points[i + 1])
    let segConsumed = 0

    while (accumulated + (segLen - segConsumed) >= emitNext) {
      const remaining = emitNext - accumulated
      const t = (segConsumed + remaining) / segLen
      result.push(lerpPoint(points[i], points[i + 1], t))
      segConsumed += remaining
      accumulated = 0
      emitNext = spacingMeters
    }
    accumulated += segLen - segConsumed
  }
  return result
}
