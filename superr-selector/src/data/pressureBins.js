import { clamp } from '../utils/math.js'
import { createRng, randomNormal } from '../utils/rng.js'
import { sampleBallRuns } from './simulation.js'

// Synthetic delivery states, pre-aggregated into bins:
//   { innings: 'first' | 'second', competition, over (1-20), wicketsLost (0-10),
//     rate (current run rate in the first innings, required run rate in the second),
//     count }
// A real backend should return the same shape, aggregated from ball-by-ball data.

function phaseRunRate(over) {
  if (over <= 6) return 1.3
  if (over <= 15) return 1.1
  return 1.7
}

function phaseWicketProb(over) {
  if (over <= 6) return 0.034
  if (over <= 15) return 0.04
  return 0.06
}

function roundToHalf(value) {
  return Math.round(value * 2) / 2
}

function addToBin(bins, innings, competition, over, wicketsLost, rate) {
  const key = innings + '|' + competition + '|' + over + '|' + wicketsLost + '|' + rate
  if (!bins[key]) {
    bins[key] = { innings: innings, competition: competition, over: over, wicketsLost: wicketsLost, rate: rate, count: 0 }
  }
  bins[key].count += 1
}

function simulateInnings(rng, competition, innings, target, bins) {
  const factor = competition === 'IPL' ? 1.03 : 0.97
  let score = 0
  let wickets = 0
  let ball = 0

  while (ball < 120 && wickets < 10) {
    const over = Math.floor(ball / 6) + 1
    const ballsRemaining = 120 - ball

    // State before the delivery is bowled.
    let rate
    if (innings === 'first') {
      rate = ball < 6 ? 8.5 : (score * 6) / ball
      rate = clamp(roundToHalf(rate), 0, 14)
    } else {
      const required = target - score
      if (required <= 0) {
        break
      }
      rate = clamp(roundToHalf((required * 6) / ballsRemaining), 0, 20)
    }
    addToBin(bins, innings, competition, over, wickets, rate)

    if (rng() < phaseWicketProb(over)) {
      wickets += 1
    } else {
      score += sampleBallRuns(rng, phaseRunRate(over) * factor).runs
    }
    ball += 1
  }
  return score
}

export function buildPressureBins() {
  const rng = createRng(777)
  const bins = {}
  const plan = [
    { competition: 'IPL', innings: 260 },
    { competition: 'T20I', innings: 180 },
  ]

  for (let p = 0; p < plan.length; p++) {
    for (let i = 0; i < plan[p].innings; i++) {
      const firstScore = simulateInnings(rng, plan[p].competition, 'first', 0, bins)
      const target = Math.max(60, Math.round(firstScore + randomNormal(rng, 1, 2))) + 1
      simulateInnings(rng, plan[p].competition, 'second', target, bins)
    }
  }

  const list = Object.keys(bins).map(function toBin(key) {
    return bins[key]
  })
  return list
}

let cachedBins = null

export function getPressureBins() {
  if (cachedBins === null) {
    cachedBins = buildPressureBins()
  }
  return cachedBins
}
