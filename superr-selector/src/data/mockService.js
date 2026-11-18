// Demo implementation of the API contract (see src/services/contracts.js).
// It computes every number from the synthetic ball-by-ball style records in
// mockGenerator.js, so filters, sorting and comparisons behave like a real backend.
// Nothing returned from here is a verified result: every response carries meta.isDemo = true.

import { getDataset } from './mockGenerator.js'
import { getPressureBins as buildBins } from './pressureBins.js'
import { demoControls } from './demoControls.js'
import { percentileRank } from '../utils/math.js'
import {
  CONFIDENCE_THRESHOLDS,
  MIN_PRESSURE_BALLS,
  RATING,
  battingBaseline,
  battingMetrics,
  bowlingBaseline,
  bowlingMetrics,
  sumBattingRecords,
  sumBowlingRecords,
} from '../utils/stats.js'
import { DEFAULT_PRESSURE_CONFIG } from '../utils/pressure.js'
import { formatNumber, formatSigned } from '../utils/format.js'

// ---------------------------------------------------------------------------
// Plumbing
// ---------------------------------------------------------------------------
async function beginRequest() {
  await new Promise(function wait(resolve) {
    setTimeout(resolve, demoControls.latencyMs)
  })
  if (demoControls.simulateError) {
    throw new Error('Simulated API failure (demo tool). Switch off "Simulate API error" and retry.')
  }
}

function buildMeta() {
  return {
    isDemo: true,
    source: 'synthetic-demo-data',
    generatedAt: new Date().toISOString(),
    notice:
      'Synthetic demo data. Players, teams and figures are invented. Nothing here is a verified result.',
  }
}

function recordMatchesFilters(record, filters, ignoreSeason) {
  if (filters.competition && filters.competition !== 'All' && record.competition !== filters.competition) {
    return false
  }
  if (!ignoreSeason && filters.season && filters.season !== 'All' && record.season !== Number(filters.season)) {
    return false
  }
  if (filters.dateFrom && record.date < filters.dateFrom) {
    return false
  }
  if (filters.dateTo && record.date > filters.dateTo) {
    return false
  }
  return true
}

function filterRecords(records, filters, ignoreSeason) {
  const result = []
  for (let i = 0; i < records.length; i++) {
    if (recordMatchesFilters(records[i], filters, ignoreSeason)) {
      result.push(records[i])
    }
  }
  return result
}

function groupByPlayer(records) {
  const groups = {}
  for (let i = 0; i < records.length; i++) {
    const id = records[i].playerId
    if (!groups[id]) {
      groups[id] = []
    }
    groups[id].push(records[i])
  }
  return groups
}

function uniqueValues(records, key) {
  const seen = {}
  const list = []
  for (let i = 0; i < records.length; i++) {
    const value = records[i][key]
    if (!seen[value]) {
      seen[value] = true
      list.push(value)
    }
  }
  return list
}

function findPlayer(type, id) {
  const data = getDataset()
  const list = type === 'batting' ? data.batters : data.bowlers
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      return list[i]
    }
  }
  return null
}

function baseFor(type, records) {
  if (type === 'batting') {
    return battingBaseline(sumBattingRecords(records))
  }
  return bowlingBaseline(sumBowlingRecords(records))
}

function metricsFor(type, records, baseline) {
  if (type === 'batting') {
    return battingMetrics(sumBattingRecords(records), baseline)
  }
  return bowlingMetrics(sumBowlingRecords(records), baseline)
}

// One row per player that has at least one record inside the filters.
function buildRows(type, filters) {
  const data = getDataset()
  const allRecords = type === 'batting' ? data.battingRecords : data.bowlingRecords
  const players = type === 'batting' ? data.batters : data.bowlers
  const records = filterRecords(allRecords, filters, false)
  const baseline = baseFor(type, records)
  const groups = groupByPlayer(records)

  const rows = []
  for (let i = 0; i < players.length; i++) {
    const player = players[i]
    const list = groups[player.id]
    if (!list || list.length === 0) {
      continue
    }
    const metrics = metricsFor(type, list, baseline)
    rows.push({
      id: player.id,
      type: type,
      name: player.name,
      teams: uniqueValues(list, 'team'),
      competitions: uniqueValues(list, 'competition'),
      ...metrics,
    })
  }
  return { rows: rows, baseline: baseline, records: records }
}

function sortByRatingDesc(rows) {
  const copy = rows.slice()
  copy.sort(function byRating(a, b) {
    if (b.rating !== a.rating) {
      return b.rating - a.rating
    }
    return b.pressureBalls - a.pressureBalls
  })
  return copy
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------
export async function getFilterOptions() {
  await beginRequest()
  const data = getDataset()
  return {
    meta: buildMeta(),
    competitions: ['IPL', 'T20I'],
    seasons: data.seasons.slice(),
    dateBounds: { min: data.matches[0].date, max: data.matches[data.matches.length - 1].date },
  }
}

// ---------------------------------------------------------------------------
// Player directory (used by global search and comparison pickers)
// ---------------------------------------------------------------------------
export async function getPlayerDirectory() {
  await beginRequest()
  const data = getDataset()
  const players = []
  const groups = [
    { type: 'batting', list: data.batters },
    { type: 'bowling', list: data.bowlers },
  ]
  for (let g = 0; g < groups.length; g++) {
    for (let i = 0; i < groups[g].list.length; i++) {
      const p = groups[g].list[i]
      players.push({
        id: p.id,
        type: groups[g].type,
        name: p.name,
        teams: Object.values(p.teams),
        competitions: p.competitions,
      })
    }
  }
  return { meta: buildMeta(), players: players }
}

// ---------------------------------------------------------------------------
// Player tables
// ---------------------------------------------------------------------------
export async function getPlayerTable(type, filters) {
  await beginRequest()
  const built = buildRows(type, filters)
  return {
    meta: buildMeta(),
    type: type,
    baseline: built.baseline,
    rows: built.rows,
    matchesInScope: uniqueValues(built.records, 'matchId').length,
  }
}

// ---------------------------------------------------------------------------
// Leaderboards
// ---------------------------------------------------------------------------
export async function getLeaderboard(type, filters, options) {
  await beginRequest()
  const minPressureBalls =
    options && options.minPressureBalls !== undefined ? options.minPressureBalls : MIN_PRESSURE_BALLS[type]
  const confidence = options && options.confidence ? options.confidence : 'All'

  const built = buildRows(type, filters)
  const eligible = []
  for (let i = 0; i < built.rows.length; i++) {
    const row = built.rows[i]
    if (row.rating === null || row.pressureBalls < minPressureBalls) {
      continue
    }
    if (confidence !== 'All' && row.confidence !== confidence) {
      continue
    }
    eligible.push(row)
  }

  const ranked = sortByRatingDesc(eligible)
  const top = []
  for (let i = 0; i < ranked.length && i < 10; i++) {
    top.push({ ...ranked[i], rank: i + 1 })
  }

  return {
    meta: buildMeta(),
    type: type,
    rows: top,
    eligibleCount: eligible.length,
    totalCount: built.rows.length,
    minPressureBalls: minPressureBalls,
    confidence: confidence,
  }
}

// ---------------------------------------------------------------------------
// Player profile
// ---------------------------------------------------------------------------
function battingComparisonRows(m) {
  return [
    { key: 'strikeRate', label: 'Strike rate', unit: 'runs / 100 balls', digits: 1, higherIsBetter: true, pressure: m.pressureStrikeRate, normal: m.normalStrikeRate },
    { key: 'dismissalRate', label: 'Dismissal rate', unit: 'per 100 balls', digits: 2, higherIsBetter: false, pressure: m.pressureDismissalRate, normal: m.normalDismissalRate },
    { key: 'boundaryPct', label: 'Boundary %', unit: '% of balls', digits: 1, higherIsBetter: true, pressure: m.pressureBoundaryPct, normal: m.normalBoundaryPct },
  ]
}

function bowlingComparisonRows(m) {
  return [
    { key: 'economy', label: 'Economy', unit: 'runs / over', digits: 2, higherIsBetter: false, pressure: m.pressureEconomy, normal: m.normalEconomy },
    { key: 'wicketRate', label: 'Wicket rate', unit: 'wickets / 24 balls', digits: 2, higherIsBetter: true, pressure: m.pressureWicketRate, normal: m.normalWicketRate },
    { key: 'dotPct', label: 'Dot-ball %', unit: '% of balls', digits: 1, higherIsBetter: true, pressure: m.pressureDotPct, normal: m.normalDotPct },
    { key: 'boundaryPct', label: 'Boundary % conceded', unit: '% of balls', digits: 1, higherIsBetter: false, pressure: m.pressureBoundaryPct, normal: m.normalBoundaryPct },
  ]
}

function seasonSplit(type, records, baseline) {
  const seasons = uniqueValues(records, 'season').sort()
  const result = []
  for (let i = 0; i < seasons.length; i++) {
    const inSeason = []
    for (let j = 0; j < records.length; j++) {
      if (records[j].season === seasons[i]) {
        inSeason.push(records[j])
      }
    }
    const m = metricsFor(type, inSeason, baseline)
    if (type === 'batting') {
      result.push({ season: seasons[i], pressure: m.pressureStrikeRate, normal: m.normalStrikeRate, matches: m.matches })
    } else {
      result.push({ season: seasons[i], pressure: m.pressureEconomy, normal: m.normalEconomy, matches: m.matches })
    }
  }
  return result
}

function consistencySummary(type, matchLog) {
  const values = []
  for (let i = 0; i < matchLog.length; i++) {
    values.push(type === 'batting' ? matchLog[i].runs : matchLog[i].economy)
  }
  if (values.length === 0) {
    return null
  }
  let total = 0
  for (let i = 0; i < values.length; i++) {
    total += values[i]
  }
  const average = total / values.length
  let squares = 0
  for (let i = 0; i < values.length; i++) {
    squares += (values[i] - average) * (values[i] - average)
  }
  const deviation = Math.sqrt(squares / values.length)

  let hits = 0
  for (let i = 0; i < values.length; i++) {
    if (type === 'batting' && values[i] >= 20) hits += 1
    if (type === 'bowling' && values[i] <= 8) hits += 1
  }
  return {
    mean: average,
    standardDeviation: deviation,
    coefficientOfVariation: average > 0 ? deviation / average : null,
    thresholdLabel: type === 'batting' ? 'Innings of 20+ runs' : 'Spells at 8.0 economy or better',
    thresholdPct: (hits * 100) / values.length,
    sample: values.length,
  }
}

export async function getPlayerProfile(type, id, filters) {
  await beginRequest()
  const player = findPlayer(type, id)
  if (player === null) {
    throw new Error('Player ' + id + ' was not found.')
  }

  const data = getDataset()
  const allRecords = type === 'batting' ? data.battingRecords : data.bowlingRecords
  const scoped = filterRecords(allRecords, filters, false)
  const baseline = baseFor(type, scoped)
  const mine = []
  for (let i = 0; i < scoped.length; i++) {
    if (scoped[i].playerId === id) {
      mine.push(scoped[i])
    }
  }

  const identity = {
    id: player.id,
    type: type,
    name: player.name,
    teams: Object.values(player.teams),
    competitions: player.competitions,
  }

  if (mine.length === 0) {
    return { meta: buildMeta(), player: identity, hasData: false }
  }

  mine.sort(function byDate(a, b) {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1
    return 0
  })

  const metrics = metricsFor(type, mine, baseline)

  const matchLog = []
  for (let i = 0; i < mine.length; i++) {
    const r = mine[i]
    if (type === 'batting') {
      matchLog.push({
        matchId: r.matchId,
        date: r.date,
        competition: r.competition,
        opposition: r.opposition,
        innings: r.innings,
        runs: r.runs,
        balls: r.balls,
        strikeRate: r.balls > 0 ? (r.runs * 100) / r.balls : null,
        pressureBalls: r.pBalls,
        pressureRuns: r.pRuns,
        dismissed: r.dismissed,
      })
    } else {
      matchLog.push({
        matchId: r.matchId,
        date: r.date,
        competition: r.competition,
        opposition: r.opposition,
        innings: r.innings,
        balls: r.balls,
        runs: r.runs,
        wickets: r.wickets,
        economy: r.balls > 0 ? (r.runs * 6) / r.balls : null,
        pressureBalls: r.pBalls,
        pressureRuns: r.pRuns,
      })
    }
  }

  return {
    meta: buildMeta(),
    player: identity,
    hasData: true,
    metrics: metrics,
    leagueBaseline: baseline,
    pressureVsNormal: type === 'batting' ? battingComparisonRows(metrics) : bowlingComparisonRows(metrics),
    bySeason: seasonSplit(type, mine, baseline),
    matchLog: matchLog,
    consistency: consistencySummary(type, matchLog),
  }
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------
const BATTING_TABLE = [
  { key: 'matches', label: 'Matches', digits: 0, higherIsBetter: null },
  { key: 'runs', label: 'Runs', digits: 0, higherIsBetter: null },
  { key: 'balls', label: 'Balls faced', digits: 0, higherIsBetter: null },
  { key: 'strikeRate', label: 'Strike rate', digits: 1, higherIsBetter: true },
  { key: 'average', label: 'Batting average', digits: 1, higherIsBetter: true },
  { key: 'boundaryPct', label: 'Boundary %', digits: 1, higherIsBetter: true },
  { key: 'dismissalRate', label: 'Dismissals / 100 balls', digits: 2, higherIsBetter: false },
  { key: 'pressureStrikeRate', label: 'Pressure strike rate', digits: 1, higherIsBetter: true },
  { key: 'normalStrikeRate', label: 'Normal strike rate', digits: 1, higherIsBetter: true },
  { key: 'pressureImprovement', label: 'Pressure improvement (SR points)', digits: 1, higherIsBetter: true },
  { key: 'pressureBalls', label: 'Pressure balls (sample)', digits: 0, higherIsBetter: null },
  { key: 'rating', label: 'Pressure rating', digits: 1, higherIsBetter: true },
  { key: 'reliability', label: 'Reliability %', digits: 0, higherIsBetter: true },
]

const BOWLING_TABLE = [
  { key: 'matches', label: 'Matches', digits: 0, higherIsBetter: null },
  { key: 'wickets', label: 'Wickets', digits: 0, higherIsBetter: null },
  { key: 'legalBalls', label: 'Legal balls', digits: 0, higherIsBetter: null },
  { key: 'economy', label: 'Economy', digits: 2, higherIsBetter: false },
  { key: 'wicketRate', label: 'Wickets / 24 balls', digits: 2, higherIsBetter: true },
  { key: 'dotPct', label: 'Dot-ball %', digits: 1, higherIsBetter: true },
  { key: 'boundaryPctConceded', label: 'Boundary % conceded', digits: 1, higherIsBetter: false },
  { key: 'pressureEconomy', label: 'Pressure economy', digits: 2, higherIsBetter: false },
  { key: 'normalEconomy', label: 'Normal economy', digits: 2, higherIsBetter: false },
  { key: 'improvement', label: 'Economy improvement', digits: 2, higherIsBetter: true },
  { key: 'pressureBalls', label: 'Pressure balls (sample)', digits: 0, higherIsBetter: null },
  { key: 'rating', label: 'Pressure rating', digits: 1, higherIsBetter: true },
  { key: 'reliability', label: 'Reliability %', digits: 0, higherIsBetter: true },
]

const BATTING_RADAR = [
  { axis: 'Pressure SR', key: 'pressureStrikeRate', higherIsBetter: true },
  { axis: 'Normal SR', key: 'normalStrikeRate', higherIsBetter: true },
  { axis: 'Average', key: 'average', higherIsBetter: true },
  { axis: 'Boundary %', key: 'boundaryPct', higherIsBetter: true },
  { axis: 'Dismissal control', key: 'dismissalRate', higherIsBetter: false },
  { axis: 'Pressure lift', key: 'pressureImprovement', higherIsBetter: true },
]

const BOWLING_RADAR = [
  { axis: 'Pressure economy', key: 'pressureEconomy', higherIsBetter: false },
  { axis: 'Normal economy', key: 'normalEconomy', higherIsBetter: false },
  { axis: 'Wicket rate', key: 'wicketRate', higherIsBetter: true },
  { axis: 'Dot-ball %', key: 'dotPct', higherIsBetter: true },
  { axis: 'Boundary control', key: 'boundaryPctConceded', higherIsBetter: false },
  { axis: 'Pressure lift', key: 'improvement', higherIsBetter: true },
]

function decideWinner(a, b, higherIsBetter) {
  if (higherIsBetter === null || a === null || b === null) {
    return null
  }
  if (a === b) {
    return 'tie'
  }
  if (higherIsBetter) {
    return a > b ? 'a' : 'b'
  }
  return a < b ? 'a' : 'b'
}

export async function getComparison(type, idA, idB, filters) {
  await beginRequest()
  const built = buildRows(type, filters)

  let rowA = null
  let rowB = null
  for (let i = 0; i < built.rows.length; i++) {
    if (built.rows[i].id === idA) rowA = built.rows[i]
    if (built.rows[i].id === idB) rowB = built.rows[i]
  }

  const identityA = findPlayer(type, idA)
  const identityB = findPlayer(type, idB)
  if (identityA === null || identityB === null) {
    throw new Error('One of the selected players was not found.')
  }

  const result = {
    meta: buildMeta(),
    type: type,
    a: { id: idA, name: identityA.name, hasData: rowA !== null, row: rowA },
    b: { id: idB, name: identityB.name, hasData: rowB !== null, row: rowB },
    table: [],
    radar: [],
    radarPoolSize: 0,
  }
  if (rowA === null || rowB === null) {
    return result
  }

  const tableDefs = type === 'batting' ? BATTING_TABLE : BOWLING_TABLE
  for (let i = 0; i < tableDefs.length; i++) {
    const def = tableDefs[i]
    const a = rowA[def.key]
    const b = rowB[def.key]
    result.table.push({
      key: def.key,
      label: def.label,
      digits: def.digits,
      higherIsBetter: def.higherIsBetter,
      a: a,
      b: b,
      winner: decideWinner(a, b, def.higherIsBetter),
    })
  }

  // Percentiles are measured against players with a sensible pressure sample.
  const minimum = MIN_PRESSURE_BALLS[type]
  let pool = []
  for (let i = 0; i < built.rows.length; i++) {
    if (built.rows[i].pressureBalls >= minimum) {
      pool.push(built.rows[i])
    }
  }
  if (pool.length < 3) {
    pool = built.rows
  }
  result.radarPoolSize = pool.length

  const radarDefs = type === 'batting' ? BATTING_RADAR : BOWLING_RADAR
  for (let i = 0; i < radarDefs.length; i++) {
    const def = radarDefs[i]
    const values = []
    for (let j = 0; j < pool.length; j++) {
      const value = pool[j][def.key]
      if (value !== null && value !== undefined) {
        values.push(value)
      }
    }
    const a = rowA[def.key]
    const b = rowB[def.key]
    result.radar.push({
      axis: def.axis,
      a: a === null || a === undefined ? 0 : percentileRank(values, a, def.higherIsBetter),
      b: b === null || b === undefined ? 0 : percentileRank(values, b, def.higherIsBetter),
    })
  }
  return result
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function pooledBatting(records) {
  const t = sumBattingRecords(records)
  return {
    pressure: t.pBalls > 0 ? (t.pRuns * 100) / t.pBalls : null,
    normal: t.nBalls > 0 ? (t.nRuns * 100) / t.nBalls : null,
    pressureBalls: t.pBalls,
  }
}

function pooledBowling(records) {
  const t = sumBowlingRecords(records)
  return {
    pressure: t.pBalls > 0 ? (t.pRuns * 6) / t.pBalls : null,
    normal: t.nBalls > 0 ? (t.nRuns * 6) / t.nBalls : null,
    pressureBalls: t.pBalls,
  }
}

function recordsForCompetition(records, competition) {
  const list = []
  for (let i = 0; i < records.length; i++) {
    if (records[i].competition === competition) {
      list.push(records[i])
    }
  }
  return list
}

function buildInsights(batRows, bowlRows, batRecords, bowlRecords) {
  const insights = []

  const batPooled = pooledBatting(batRecords)
  if (batPooled.pressure !== null && batPooled.normal !== null) {
    const diff = batPooled.pressure - batPooled.normal
    insights.push({
      id: 'league-batting',
      tone: 'neutral',
      title: 'League batting under pressure',
      body:
        'Batters score at ' + formatNumber(batPooled.pressure, 1) + ' runs per 100 balls in pressure deliveries versus ' +
        formatNumber(batPooled.normal, 1) + ' otherwise (' + formatSigned(diff, 1) + ' points) in the current selection.',
    })
  }

  const eligibleBat = []
  for (let i = 0; i < batRows.length; i++) {
    if (batRows[i].pressureBalls >= MIN_PRESSURE_BALLS.batting && batRows[i].pressureImprovement !== null) {
      eligibleBat.push(batRows[i])
    }
  }
  if (eligibleBat.length > 0) {
    let best = eligibleBat[0]
    for (let i = 1; i < eligibleBat.length; i++) {
      if (eligibleBat[i].pressureImprovement > best.pressureImprovement) {
        best = eligibleBat[i]
      }
    }
    insights.push({
      id: 'best-lift-batter',
      tone: 'positive',
      title: 'Largest batting lift under pressure',
      body:
        best.name + ' improves by ' + formatSigned(best.pressureImprovement, 1) + ' strike-rate points under pressure, from ' +
        formatNumber(best.pressureBalls) + ' pressure balls (' + best.confidence.toLowerCase() + ' confidence).',
      playerRef: { type: 'batting', id: best.id },
    })
  }

  const bowlPooled = pooledBowling(bowlRecords)
  if (bowlPooled.pressure !== null && bowlPooled.normal !== null) {
    const diff = bowlPooled.pressure - bowlPooled.normal
    insights.push({
      id: 'league-bowling',
      tone: 'neutral',
      title: 'League bowling under pressure',
      body:
        'Bowlers concede ' + formatNumber(bowlPooled.pressure, 2) + ' runs per over under pressure versus ' +
        formatNumber(bowlPooled.normal, 2) + ' otherwise (' + formatSigned(diff, 2) + ').',
    })
  }

  const ratedBowlers = sortByRatingDesc(bowlRows.filter(function eligible(row) {
    return row.rating !== null && row.pressureBalls >= MIN_PRESSURE_BALLS.bowling
  }))
  if (ratedBowlers.length > 0) {
    insights.push({
      id: 'top-bowler',
      tone: 'positive',
      title: 'Highest-rated pressure bowler',
      body:
        ratedBowlers[0].name + ' leads bowlers with a pressure rating of ' + formatNumber(ratedBowlers[0].rating, 1) +
        ' (50 is league average) at ' + formatNumber(ratedBowlers[0].pressureEconomy, 2) + ' pressure economy.',
      playerRef: { type: 'bowling', id: ratedBowlers[0].id },
    })
  }

  let lowCount = 0
  for (let i = 0; i < batRows.length; i++) {
    if (batRows[i].confidence === 'Low') {
      lowCount += 1
    }
  }
  if (batRows.length > 0) {
    insights.push({
      id: 'small-samples',
      tone: lowCount > 0 ? 'caution' : 'neutral',
      title: 'Sample-size warning',
      body:
        lowCount + ' of ' + batRows.length + ' batters have fewer than ' + CONFIDENCE_THRESHOLDS.batting.medium +
        ' pressure balls in this selection. Treat their pressure numbers as indicative only.',
    })
  }

  const ipl = pooledBatting(recordsForCompetition(batRecords, 'IPL'))
  const t20i = pooledBatting(recordsForCompetition(batRecords, 'T20I'))
  if (ipl.pressure !== null && t20i.pressure !== null) {
    insights.push({
      id: 'competition-gap',
      tone: 'neutral',
      title: 'IPL vs T20I scoring environment',
      body:
        'Pooled pressure strike rate is ' + formatNumber(ipl.pressure, 1) + ' in IPL and ' + formatNumber(t20i.pressure, 1) +
        ' in T20I. Ratings are computed against the pooled baseline of the current selection, so cross-competition reads need care.',
    })
  }
  return insights
}

export async function getOverview(filters) {
  await beginRequest()
  const data = getDataset()
  const batScoped = filterRecords(data.battingRecords, filters, false)
  const bowlScoped = filterRecords(data.bowlingRecords, filters, false)

  const matchSet = {}
  const playerSet = {}
  for (let i = 0; i < batScoped.length; i++) {
    matchSet[batScoped[i].matchId] = true
    playerSet[batScoped[i].playerId] = true
  }
  for (let i = 0; i < bowlScoped.length; i++) {
    matchSet[bowlScoped[i].matchId] = true
    playerSet[bowlScoped[i].playerId] = true
  }

  const batBuilt = buildRows('batting', filters)
  const bowlBuilt = buildRows('bowling', filters)

  const competitionsPresent = []
  const allCompetitions = ['IPL', 'T20I']
  for (let c = 0; c < allCompetitions.length; c++) {
    const name = allCompetitions[c]
    const bat = recordsForCompetition(batScoped, name)
    const bowl = recordsForCompetition(bowlScoped, name)
    if (bat.length === 0 && bowl.length === 0) {
      continue
    }
    const compMatches = {}
    const compPlayers = {}
    for (let i = 0; i < bat.length; i++) {
      compMatches[bat[i].matchId] = true
      compPlayers[bat[i].playerId] = true
    }
    for (let i = 0; i < bowl.length; i++) {
      compMatches[bowl[i].matchId] = true
      compPlayers[bowl[i].playerId] = true
    }
    competitionsPresent.push({
      name: name,
      matches: Object.keys(compMatches).length,
      players: Object.keys(compPlayers).length,
      pressureDeliveries: pooledBatting(bat).pressureBalls,
      batting: pooledBatting(bat),
      bowling: pooledBowling(bowl),
    })
  }

  const pressureVsNormal = { batting: [], bowling: [] }
  if (competitionsPresent.length > 1) {
    const allBat = pooledBatting(batScoped)
    const allBowl = pooledBowling(bowlScoped)
    pressureVsNormal.batting.push({ group: 'All', pressure: allBat.pressure, normal: allBat.normal })
    pressureVsNormal.bowling.push({ group: 'All', pressure: allBowl.pressure, normal: allBowl.normal })
  }
  for (let i = 0; i < competitionsPresent.length; i++) {
    const comp = competitionsPresent[i]
    pressureVsNormal.batting.push({ group: comp.name, pressure: comp.batting.pressure, normal: comp.batting.normal })
    pressureVsNormal.bowling.push({ group: comp.name, pressure: comp.bowling.pressure, normal: comp.bowling.normal })
  }

  // Season trend ignores the season filter so the trend always has context.
  const trendBat = filterRecords(data.battingRecords, filters, true)
  const trendBowl = filterRecords(data.bowlingRecords, filters, true)
  const seasonTrend = []
  for (let s = 0; s < data.seasons.length; s++) {
    const season = data.seasons[s]
    const bat = []
    const bowl = []
    for (let i = 0; i < trendBat.length; i++) {
      if (trendBat[i].season === season) bat.push(trendBat[i])
    }
    for (let i = 0; i < trendBowl.length; i++) {
      if (trendBowl[i].season === season) bowl.push(trendBowl[i])
    }
    if (bat.length === 0 && bowl.length === 0) {
      continue
    }
    const pb = pooledBatting(bat)
    const pw = pooledBowling(bowl)
    seasonTrend.push({
      season: season,
      battingPressure: pb.pressure,
      battingNormal: pb.normal,
      bowlingPressure: pw.pressure,
      bowlingNormal: pw.normal,
    })
  }

  const topBatters = sortByRatingDesc(
    batBuilt.rows.filter(function eligible(row) {
      return row.rating !== null && row.pressureBalls >= MIN_PRESSURE_BALLS.batting
    }),
  ).slice(0, 5)
  const topBowlers = sortByRatingDesc(
    bowlBuilt.rows.filter(function eligible(row) {
      return row.rating !== null && row.pressureBalls >= MIN_PRESSURE_BALLS.bowling
    }),
  ).slice(0, 5)

  return {
    meta: buildMeta(),
    kpis: {
      matches: Object.keys(matchSet).length,
      players: Object.keys(playerSet).length,
      batters: batBuilt.rows.length,
      bowlers: bowlBuilt.rows.length,
      pressureDeliveries: pooledBatting(batScoped).pressureBalls,
      pressureDeliveriesBowled: pooledBowling(bowlScoped).pressureBalls,
      competitions: competitionsPresent.map(function nameOf(c) {
        return c.name
      }),
    },
    pressureVsNormal: pressureVsNormal,
    seasonTrend: seasonTrend,
    competitionDistribution: competitionsPresent.map(function summary(c) {
      return { name: c.name, matches: c.matches, players: c.players, pressureDeliveries: c.pressureDeliveries }
    }),
    topPerformers: { batters: topBatters, bowlers: topBowlers },
    insights: buildInsights(batBuilt.rows, bowlBuilt.rows, batScoped, bowlScoped),
  }
}

// ---------------------------------------------------------------------------
// Pressure analysis
// ---------------------------------------------------------------------------
export async function getPressureBins(filters) {
  await beginRequest()
  const all = buildBins()
  const bins = []
  for (let i = 0; i < all.length; i++) {
    if (filters.competition && filters.competition !== 'All' && all[i].competition !== filters.competition) {
      continue
    }
    bins.push(all[i])
  }
  return {
    meta: buildMeta(),
    defaults: DEFAULT_PRESSURE_CONFIG,
    bins: bins,
  }
}

// ---------------------------------------------------------------------------
// Methodology
// ---------------------------------------------------------------------------
export async function getMethodology() {
  await beginRequest()
  const data = getDataset()
  const comparison = []
  const names = ['IPL', 'T20I']
  for (let i = 0; i < names.length; i++) {
    const bat = recordsForCompetition(data.battingRecords, names[i])
    const bowl = recordsForCompetition(data.bowlingRecords, names[i])
    const batTotals = sumBattingRecords(bat)
    const bowlTotals = sumBowlingRecords(bowl)
    const matchSet = {}
    for (let j = 0; j < bat.length; j++) matchSet[bat[j].matchId] = true
    for (let j = 0; j < bowl.length; j++) matchSet[bowl[j].matchId] = true
    comparison.push({
      competition: names[i],
      matches: Object.keys(matchSet).length,
      pressureShareOfBalls: batTotals.balls > 0 ? (batTotals.pBalls * 100) / batTotals.balls : null,
      pressureStrikeRate: batTotals.pBalls > 0 ? (batTotals.pRuns * 100) / batTotals.pBalls : null,
      normalStrikeRate: batTotals.nBalls > 0 ? (batTotals.nRuns * 100) / batTotals.nBalls : null,
      pressureEconomy: bowlTotals.pBalls > 0 ? (bowlTotals.pRuns * 6) / bowlTotals.pBalls : null,
      normalEconomy: bowlTotals.nBalls > 0 ? (bowlTotals.nRuns * 6) / bowlTotals.nBalls : null,
    })
  }

  return {
    meta: buildMeta(),
    version: '0.1-demo',
    parameters: {
      rating: RATING,
      confidence: CONFIDENCE_THRESHOLDS,
      minPressureBalls: MIN_PRESSURE_BALLS,
      pressure: DEFAULT_PRESSURE_CONFIG,
    },
    competitionComparison: comparison,
  }
}
