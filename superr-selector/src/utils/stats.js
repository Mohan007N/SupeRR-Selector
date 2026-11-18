import { clamp } from './math.js'

// ---------------------------------------------------------------------------
// Research parameters. These are configurable choices, not official rules, and
// none of them has been validated against held-out data.
// ---------------------------------------------------------------------------
export const RATING = {
  scale: 100,
  // Each index is clamped so a handful of rare events (dismissals, wickets) cannot dominate a rating.
  indexLimits: { min: 0.5, max: 1.5 },
  batting: { priorBalls: 100, weightStrikeRate: 0.6, weightDismissal: 0.4 },
  bowling: { priorBalls: 100, weightEconomy: 0.55, weightWickets: 0.45 },
}

export const CONFIDENCE_THRESHOLDS = {
  batting: { high: 150, medium: 75 },
  bowling: { high: 220, medium: 110 },
}

export const MIN_PRESSURE_BALLS = { batting: 60, bowling: 40 }

export function confidenceLevel(type, pressureBalls) {
  const limits = CONFIDENCE_THRESHOLDS[type]
  if (pressureBalls >= limits.high) {
    return 'High'
  }
  if (pressureBalls >= limits.medium) {
    return 'Medium'
  }
  return 'Low'
}

export function reliabilityPercent(type, pressureBalls) {
  const prior = RATING[type].priorBalls
  return (pressureBalls / (pressureBalls + prior)) * 100
}

// ---------------------------------------------------------------------------
// Batting
// ---------------------------------------------------------------------------
export function sumBattingRecords(records) {
  const t = {
    matches: 0,
    balls: 0,
    runs: 0,
    fours: 0,
    sixes: 0,
    dismissals: 0,
    pBalls: 0,
    pRuns: 0,
    pDismissals: 0,
    pBoundaries: 0,
    nBalls: 0,
    nRuns: 0,
    nDismissals: 0,
    nBoundaries: 0,
  }
  for (let i = 0; i < records.length; i++) {
    const r = records[i]
    t.matches += 1
    t.balls += r.balls
    t.runs += r.runs
    t.fours += r.fours
    t.sixes += r.sixes
    t.dismissals += r.dismissed ? 1 : 0
    t.pBalls += r.pBalls
    t.pRuns += r.pRuns
    t.pDismissals += r.pDismissed
    t.pBoundaries += r.pBoundaries
    t.nBalls += r.nBalls
    t.nRuns += r.nRuns
    t.nDismissals += r.nDismissed
    t.nBoundaries += r.nBoundaries
  }
  return t
}

// League baseline: every record in the current filter, pooled.
export function battingBaseline(totals) {
  return {
    pressureBalls: totals.pBalls,
    pressureStrikeRate: totals.pBalls > 0 ? (totals.pRuns * 100) / totals.pBalls : null,
    pressureDismissalPerBall: totals.pBalls > 0 ? totals.pDismissals / totals.pBalls : null,
    normalStrikeRate: totals.nBalls > 0 ? (totals.nRuns * 100) / totals.nBalls : null,
    normalDismissalPerBall: totals.nBalls > 0 ? totals.nDismissals / totals.nBalls : null,
  }
}

export function rateBatter(totals, baseline) {
  if (totals.pBalls === 0 || !baseline.pressureStrikeRate) {
    return null
  }
  const k = RATING.batting.priorBalls
  const leagueSr = baseline.pressureStrikeRate
  const leagueDr = baseline.pressureDismissalPerBall || 0

  // Shrink the player's pressure numbers toward the league baseline.
  const adjustedSr = ((totals.pRuns + (k * leagueSr) / 100) / (totals.pBalls + k)) * 100
  const adjustedDr = (totals.pDismissals + k * leagueDr) / (totals.pBalls + k)

  const limits = RATING.indexLimits
  const strikeRateIndex = clamp(adjustedSr / leagueSr, limits.min, limits.max)
  let dismissalIndex = 1
  if (adjustedDr > 0 && leagueDr > 0) {
    dismissalIndex = clamp(leagueDr / adjustedDr, limits.min, limits.max)
  }

  const score =
    RATING.batting.weightStrikeRate * strikeRateIndex +
    RATING.batting.weightDismissal * dismissalIndex
  return clamp(50 + RATING.scale * (score - 1), 0, 100)
}

export function battingMetrics(totals, baseline) {
  const hasBalls = totals.balls > 0
  const pressureStrikeRate = totals.pBalls > 0 ? (totals.pRuns * 100) / totals.pBalls : null
  const normalStrikeRate = totals.nBalls > 0 ? (totals.nRuns * 100) / totals.nBalls : null
  let pressureImprovement = null
  if (pressureStrikeRate !== null && normalStrikeRate !== null) {
    pressureImprovement = pressureStrikeRate - normalStrikeRate
  }
  return {
    matches: totals.matches,
    runs: totals.runs,
    balls: totals.balls,
    dismissals: totals.dismissals,
    strikeRate: hasBalls ? (totals.runs * 100) / totals.balls : null,
    average: totals.dismissals > 0 ? totals.runs / totals.dismissals : null,
    boundaryPct: hasBalls ? ((totals.fours + totals.sixes) * 100) / totals.balls : null,
    dismissalRate: hasBalls ? (totals.dismissals * 100) / totals.balls : null,
    pressureBalls: totals.pBalls,
    normalBalls: totals.nBalls,
    pressureStrikeRate: pressureStrikeRate,
    normalStrikeRate: normalStrikeRate,
    pressureImprovement: pressureImprovement,
    pressureDismissalRate: totals.pBalls > 0 ? (totals.pDismissals * 100) / totals.pBalls : null,
    normalDismissalRate: totals.nBalls > 0 ? (totals.nDismissals * 100) / totals.nBalls : null,
    pressureBoundaryPct: totals.pBalls > 0 ? (totals.pBoundaries * 100) / totals.pBalls : null,
    normalBoundaryPct: totals.nBalls > 0 ? (totals.nBoundaries * 100) / totals.nBalls : null,
    rating: rateBatter(totals, baseline),
    reliability: reliabilityPercent('batting', totals.pBalls),
    confidence: confidenceLevel('batting', totals.pBalls),
  }
}

// ---------------------------------------------------------------------------
// Bowling
// ---------------------------------------------------------------------------
export function sumBowlingRecords(records) {
  const t = {
    matches: 0,
    balls: 0,
    runs: 0,
    wickets: 0,
    dots: 0,
    boundaries: 0,
    pBalls: 0,
    pRuns: 0,
    pWickets: 0,
    pDots: 0,
    pBoundaries: 0,
    nBalls: 0,
    nRuns: 0,
    nWickets: 0,
    nDots: 0,
    nBoundaries: 0,
  }
  for (let i = 0; i < records.length; i++) {
    const r = records[i]
    t.matches += 1
    t.balls += r.balls
    t.runs += r.runs
    t.wickets += r.wickets
    t.dots += r.dots
    t.boundaries += r.boundaries
    t.pBalls += r.pBalls
    t.pRuns += r.pRuns
    t.pWickets += r.pWickets
    t.pDots += r.pDots
    t.pBoundaries += r.pBoundaries
    t.nBalls += r.nBalls
    t.nRuns += r.nRuns
    t.nWickets += r.nWickets
    t.nDots += r.nDots
    t.nBoundaries += r.nBoundaries
  }
  return t
}

export function bowlingBaseline(totals) {
  return {
    pressureBalls: totals.pBalls,
    pressureEconomy: totals.pBalls > 0 ? (totals.pRuns * 6) / totals.pBalls : null,
    pressureWicketsPerBall: totals.pBalls > 0 ? totals.pWickets / totals.pBalls : null,
    normalEconomy: totals.nBalls > 0 ? (totals.nRuns * 6) / totals.nBalls : null,
    normalWicketsPerBall: totals.nBalls > 0 ? totals.nWickets / totals.nBalls : null,
  }
}

export function rateBowler(totals, baseline) {
  if (totals.pBalls === 0 || !baseline.pressureEconomy) {
    return null
  }
  const k = RATING.bowling.priorBalls
  const leagueEcon = baseline.pressureEconomy
  const leagueWr = baseline.pressureWicketsPerBall || 0

  const adjustedEcon = ((totals.pRuns + (k * leagueEcon) / 6) / (totals.pBalls + k)) * 6
  const adjustedWr = (totals.pWickets + k * leagueWr) / (totals.pBalls + k)

  const limits = RATING.indexLimits
  const economyIndex = clamp(leagueEcon / adjustedEcon, limits.min, limits.max)
  let wicketIndex = 1
  if (leagueWr > 0) {
    wicketIndex = clamp(adjustedWr / leagueWr, limits.min, limits.max)
  }

  const score =
    RATING.bowling.weightEconomy * economyIndex + RATING.bowling.weightWickets * wicketIndex
  return clamp(50 + RATING.scale * (score - 1), 0, 100)
}

export function bowlingMetrics(totals, baseline) {
  const hasBalls = totals.balls > 0
  const pressureEconomy = totals.pBalls > 0 ? (totals.pRuns * 6) / totals.pBalls : null
  const normalEconomy = totals.nBalls > 0 ? (totals.nRuns * 6) / totals.nBalls : null
  let improvement = null
  if (pressureEconomy !== null && normalEconomy !== null) {
    // Positive means the bowler concedes fewer runs per over under pressure.
    improvement = normalEconomy - pressureEconomy
  }
  return {
    matches: totals.matches,
    wickets: totals.wickets,
    legalBalls: totals.balls,
    runsConceded: totals.runs,
    economy: hasBalls ? (totals.runs * 6) / totals.balls : null,
    wicketRate: hasBalls ? (totals.wickets * 24) / totals.balls : null,
    dotPct: hasBalls ? (totals.dots * 100) / totals.balls : null,
    boundaryPctConceded: hasBalls ? (totals.boundaries * 100) / totals.balls : null,
    pressureBalls: totals.pBalls,
    normalBalls: totals.nBalls,
    pressureWickets: totals.pWickets,
    pressureEconomy: pressureEconomy,
    normalEconomy: normalEconomy,
    improvement: improvement,
    pressureWicketRate: totals.pBalls > 0 ? (totals.pWickets * 24) / totals.pBalls : null,
    normalWicketRate: totals.nBalls > 0 ? (totals.nWickets * 24) / totals.nBalls : null,
    pressureDotPct: totals.pBalls > 0 ? (totals.pDots * 100) / totals.pBalls : null,
    normalDotPct: totals.nBalls > 0 ? (totals.nDots * 100) / totals.nBalls : null,
    pressureBoundaryPct: totals.pBalls > 0 ? (totals.pBoundaries * 100) / totals.pBalls : null,
    normalBoundaryPct: totals.nBalls > 0 ? (totals.nBoundaries * 100) / totals.nBalls : null,
    rating: rateBowler(totals, baseline),
    reliability: reliabilityPercent('bowling', totals.pBalls),
    confidence: confidenceLevel('bowling', totals.pBalls),
  }
}
