import { textToGpsRoute, subsampleWaypoints } from './textToRoute'
import { fetchFootRoute } from './routing'
import { haversineDist } from './geo'

const SCALES = [200, 500, 1000, 2000]
const KEY_COUNT = 40  // More keypoints → route follows letter shape more closely
const EVAL_COUNT = 80 // Points sampled from ideal shape for scoring

/**
 * Average minimum distance (meters) from each ideal point to the nearest route point.
 * Lower = the route covers the letter shape better.
 */
function rawShapeError(idealPoints, routePoints) {
  if (!routePoints.length) return Infinity
  return idealPoints.reduce((sum, ideal) => {
    const minDist = routePoints.reduce(
      (min, rp) => Math.min(min, haversineDist(ideal, rp)),
      Infinity
    )
    return sum + minDist
  }, 0) / idealPoints.length
}

/**
 * Tries SCALES in parallel, scores each by normalised shape fidelity
 * (raw error / scale), and returns the best { scale, route, score }.
 *
 * Falls back to the largest successful route if all scores are equal,
 * or throws if every OSRM call fails.
 */
export async function findBestRoute(text, center) {
  const attempts = await Promise.allSettled(
    SCALES.map(async (scale) => {
      const allWaypoints = textToGpsRoute(text, center, scale)
      if (allWaypoints.length < 2) throw new Error('Too few waypoints')

      const keyWaypoints = subsampleWaypoints(allWaypoints, KEY_COUNT)
      const route = await fetchFootRoute(keyWaypoints)

      // Score: how closely does the road route cover the ideal letter shape?
      const evalPoints = subsampleWaypoints(allWaypoints, EVAL_COUNT)
      const error = rawShapeError(evalPoints, route)
      const score = error / scale  // normalise so scales are comparable

      return { scale, route, score }
    })
  )

  const successful = attempts
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)

  if (successful.length === 0) throw new Error('All route attempts failed')

  // Lowest normalised score wins; on tie prefer smaller scale (shorter walk)
  successful.sort((a, b) => a.score - b.score || a.scale - b.scale)
  return successful[0]
}
