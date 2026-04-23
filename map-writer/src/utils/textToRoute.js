/**
 * Converts text into a series of GPS waypoints that form the letter shapes.
 * Uses Canvas API to render text, samples filled pixels, then maps pixel
 * coordinates to geographic coordinates centered on the user's position.
 *
 * Returns: [{lat, lng}] in boustrophedon (zigzag row) order for efficient walking.
 */
export function textToGpsRoute(text, center, heightMeters = 300) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const fontSize = 200
  const padding = 20

  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  const measured = ctx.measureText(text)
  canvas.width = Math.ceil(measured.width) + padding * 2
  canvas.height = Math.ceil(fontSize * 1.3)

  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#000'
  ctx.fillText(text, padding, fontSize * 0.05)

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const step = 10
  const pixels = []

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] > 100) {
        pixels.push({ x, y })
      }
    }
  }

  // Boustrophedon ordering: zigzag row by row for efficient walking
  const rowMap = new Map()
  for (const p of pixels) {
    const row = Math.floor(p.y / step)
    if (!rowMap.has(row)) rowMap.set(row, [])
    rowMap.get(row).push(p)
  }

  const ordered = []
  const rows = [...rowMap.entries()].sort((a, b) => a[0] - b[0])
  rows.forEach(([, pts], i) => {
    pts.sort((a, b) => i % 2 === 0 ? a.x - b.x : b.x - a.x)
    ordered.push(...pts)
  })

  const metersPerPixel = heightMeters / height
  const latPerMeter = 1 / 111320
  const lngPerMeter = 1 / (111320 * Math.cos(center.lat * Math.PI / 180))

  return ordered.map(({ x, y }) => ({
    lat: center.lat + (height / 2 - y) * metersPerPixel * latPerMeter,
    lng: center.lng + (x - width / 2) * metersPerPixel * lngPerMeter,
  }))
}
