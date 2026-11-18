import { clamp } from '../utils/math.js'

// Draw the outcome of one delivery given the average runs per ball.
// Returns { runs, isBoundary, isSix }.
export function sampleBallRuns(rng, meanRunsPerBall) {
  const ratePerOver = meanRunsPerBall * 6
  const boundaryProb = clamp(0.1 + (ratePerOver - 7) / 16, 0.05, 0.32)

  if (rng() < boundaryProb) {
    const isSix = rng() < 0.4
    return { runs: isSix ? 6 : 4, isBoundary: true, isSix: isSix }
  }

  // Not a boundary: pick dot / single / two / three so the overall mean lands near the target.
  const boundaryMean = boundaryProb * 4.8
  const nonBoundaryMean = clamp((meanRunsPerBall - boundaryMean) / (1 - boundaryProb), 0.15, 1.4)
  const twoProb = 0.05
  const threeProb = 0.005
  const singleProb = clamp(nonBoundaryMean - 2 * twoProb - 3 * threeProb, 0.02, 0.9)

  const roll = rng()
  if (roll < singleProb) {
    return { runs: 1, isBoundary: false, isSix: false }
  }
  if (roll < singleProb + twoProb) {
    return { runs: 2, isBoundary: false, isSix: false }
  }
  if (roll < singleProb + twoProb + threeProb) {
    return { runs: 3, isBoundary: false, isSix: false }
  }
  return { runs: 0, isBoundary: false, isSix: false }
}
