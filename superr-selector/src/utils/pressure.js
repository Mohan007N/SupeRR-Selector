import { clamp } from './math.js'

// Pressure Index (PI) is a configurable research construct on a 0-100 scale.
// It is NOT an official competition rule and has not been validated.

export const TOTAL_BALLS = 120

export const PRESSURE_LEVELS = ['Low', 'Medium', 'High']

export const DEFAULT_PRESSURE_CONFIG = {
  first: {
    weights: { rate: 30, wickets: 40, stage: 30 },
    thresholds: { lowMax: 30, mediumMax: 55 },
  },
  second: {
    weights: { rate: 50, wickets: 25, stage: 25 },
    thresholds: { lowMax: 33, mediumMax: 60 },
  },
}

// Fixed reference points used to scale the run-rate component.
export const RATE_REFERENCE = {
  parRate: 8.5, // first innings: scoring slower than this adds pressure
  slowRate: 5, // first innings: run rate at which the component reaches 1
  chaseEasy: 6, // second innings: required rate at which the component is 0
  chaseHard: 14, // second innings: required rate at which the component reaches 1
}

export function ballsRemainingAtOver(over) {
  // Mid-over estimate for an over number from 1 to 20.
  return TOTAL_BALLS - (over - 1) * 6 - 3
}

export function rateComponent(innings, rate) {
  if (innings === 'first') {
    return clamp((RATE_REFERENCE.parRate - rate) / (RATE_REFERENCE.parRate - RATE_REFERENCE.slowRate), 0, 1)
  }
  return clamp((rate - RATE_REFERENCE.chaseEasy) / (RATE_REFERENCE.chaseHard - RATE_REFERENCE.chaseEasy), 0, 1)
}

export function pressureIndex(innings, state, innConfig) {
  const weights = innConfig.weights
  const totalWeight = weights.rate + weights.wickets + weights.stage
  if (totalWeight <= 0) {
    return 0
  }
  const fRate = rateComponent(innings, state.rate)
  const fWickets = clamp(state.wicketsLost / 10, 0, 1)
  const fStage = clamp(1 - state.ballsRemaining / TOTAL_BALLS, 0, 1)
  const weighted = weights.rate * fRate + weights.wickets * fWickets + weights.stage * fStage
  return (100 * weighted) / totalWeight
}

export function pressureLevel(index, thresholds) {
  if (index < thresholds.lowMax) {
    return 'Low'
  }
  if (index < thresholds.mediumMax) {
    return 'Medium'
  }
  return 'High'
}

// Summarise pre-aggregated delivery-state bins under the current configuration.
// Bin shape: { innings, competition, over, wicketsLost, rate, count }
export function analysePressure(bins, innings, innConfig) {
  const counts = { Low: 0, Medium: 0, High: 0 }
  let total = 0

  const overTotals = []
  for (let o = 0; o <= 20; o++) {
    overTotals.push({ weightedIndex: 0, count: 0, high: 0 })
  }
  const gridTotals = {}

  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i]
    if (bin.innings !== innings) {
      continue
    }
    const state = {
      rate: bin.rate,
      wicketsLost: bin.wicketsLost,
      ballsRemaining: ballsRemainingAtOver(bin.over),
    }
    const index = pressureIndex(innings, state, innConfig)
    const level = pressureLevel(index, innConfig.thresholds)

    counts[level] += bin.count
    total += bin.count

    overTotals[bin.over].weightedIndex += index * bin.count
    overTotals[bin.over].count += bin.count
    if (level === 'High') {
      overTotals[bin.over].high += bin.count
    }

    const gridKey = bin.over + '|' + bin.wicketsLost
    if (!gridTotals[gridKey]) {
      gridTotals[gridKey] = { over: bin.over, wickets: bin.wicketsLost, weightedIndex: 0, count: 0 }
    }
    gridTotals[gridKey].weightedIndex += index * bin.count
    gridTotals[gridKey].count += bin.count
  }

  const distribution = []
  for (let i = 0; i < PRESSURE_LEVELS.length; i++) {
    const level = PRESSURE_LEVELS[i]
    distribution.push({
      level: level,
      count: counts[level],
      share: total > 0 ? (counts[level] * 100) / total : 0,
    })
  }

  const byOver = []
  for (let over = 1; over <= 20; over++) {
    const entry = overTotals[over]
    byOver.push({
      over: over,
      meanIndex: entry.count > 0 ? entry.weightedIndex / entry.count : null,
      highShare: entry.count > 0 ? (entry.high * 100) / entry.count : null,
      deliveries: entry.count,
    })
  }

  const grid = []
  const gridKeys = Object.keys(gridTotals)
  for (let i = 0; i < gridKeys.length; i++) {
    const cell = gridTotals[gridKeys[i]]
    grid.push({
      over: cell.over,
      wickets: cell.wickets,
      meanIndex: cell.weightedIndex / cell.count,
      count: cell.count,
    })
  }

  return { total: total, distribution: distribution, byOver: byOver, grid: grid }
}
