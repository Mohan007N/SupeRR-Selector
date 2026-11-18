import { clamp } from '../utils/math.js'
import { createRng, pickOne, pickWeighted, randomBetween, randomInt, randomNormal } from '../utils/rng.js'
import { sampleBallRuns } from './simulation.js'
import { BATTER_DEFS, BOWLER_DEFS, IPL_TEAMS, T20I_TEAMS } from './mockPlayers.js'

export const SEASONS = [2019, 2020, 2021, 2022, 2023, 2024, 2025]

// Competition-level scoring environment (IPL slightly higher scoring in this synthetic world).
const COMPETITION_FACTOR = { IPL: 1.03, T20I: 0.97 }

const IPL_MATCHES_PER_SEASON = 28
const T20I_MATCHES_PER_SEASON = 18

function isoDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------
function buildMatches() {
  const rng = createRng(20250)
  const matches = []

  for (let s = 0; s < SEASONS.length; s++) {
    const season = SEASONS[s]
    const competitions = ['IPL', 'T20I']

    for (let c = 0; c < competitions.length; c++) {
      const competition = competitions[c]
      const teams = competition === 'IPL' ? IPL_TEAMS : T20I_TEAMS
      const count = competition === 'IPL' ? IPL_MATCHES_PER_SEASON : T20I_MATCHES_PER_SEASON

      for (let i = 0; i < count; i++) {
        const teamA = pickOne(rng, teams).code
        let teamB = pickOne(rng, teams).code
        while (teamB === teamA) {
          teamB = pickOne(rng, teams).code
        }

        let date
        if (competition === 'IPL') {
          // Late March to late May.
          date = isoDate(season, 2, 26 + randomInt(rng, 0, 60))
        } else {
          const months = [0, 1, 6, 7, 8, 9, 10, 11]
          date = isoDate(season, pickOne(rng, months), randomInt(rng, 1, 28))
        }

        matches.push({ date: date, season: season, competition: competition, teamA: teamA, teamB: teamB })
      }
    }
  }

  matches.sort(function byDate(a, b) {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1
    return 0
  })
  for (let i = 0; i < matches.length; i++) {
    matches[i].id = 'm' + String(i + 1).padStart(4, '0')
  }
  return matches
}

// ---------------------------------------------------------------------------
// Player profiles (hidden "true" skill used to simulate deliveries)
// ---------------------------------------------------------------------------
function buildBatterProfile(rng) {
  const normalSr = clamp(randomNormal(rng, 132, 11), 108, 160)
  const pressureSr = clamp(normalSr + randomNormal(rng, 2, 12), 95, 190)
  const normalDismissProb = clamp(randomNormal(rng, 0.04, 0.008), 0.02, 0.07)
  const pressureDismissProb = clamp(normalDismissProb * clamp(randomNormal(rng, 1.15, 0.25), 0.6, 1.8), 0.015, 0.1)
  return {
    normalSr: normalSr,
    pressureSr: pressureSr,
    normalDismissProb: normalDismissProb,
    pressureDismissProb: pressureDismissProb,
    ballsMean: randomBetween(rng, 12, 28),
    matchShare: randomBetween(rng, 0.45, 0.95),
  }
}

function buildBowlerProfile(rng) {
  const normalEcon = clamp(randomNormal(rng, 8.1, 0.6), 6.5, 9.6)
  const pressureEcon = clamp(normalEcon + randomNormal(rng, 0.3, 0.9), 5.5, 12)
  const normalWicketProb = clamp(randomNormal(rng, 0.042, 0.01), 0.02, 0.075)
  const pressureWicketProb = clamp(normalWicketProb * clamp(randomNormal(rng, 1.05, 0.3), 0.5, 1.8), 0.015, 0.1)
  return {
    normalEcon: normalEcon,
    pressureEcon: pressureEcon,
    normalWicketProb: normalWicketProb,
    pressureWicketProb: pressureWicketProb,
    matchShare: randomBetween(rng, 0.45, 0.95),
  }
}

// ---------------------------------------------------------------------------
// Innings simulation
// ---------------------------------------------------------------------------
function simulateBattingInnings(rng, profile, factor, innings) {
  const planned = clamp(Math.round(randomNormal(rng, profile.ballsMean, profile.ballsMean * 0.6)), 2, 70)
  const baseShare = innings === 2 ? 0.45 : 0.2
  const share = clamp(randomNormal(rng, baseShare, 0.15), 0, 0.9)
  // Deliveries from this index onward count as "pressure deliveries".
  const pressureStart = Math.floor(planned * (1 - share))

  const rec = {
    balls: 0,
    runs: 0,
    fours: 0,
    sixes: 0,
    dismissed: false,
    pBalls: 0,
    pRuns: 0,
    pDismissed: 0,
    pBoundaries: 0,
    nBalls: 0,
    nRuns: 0,
    nDismissed: 0,
    nBoundaries: 0,
  }

  for (let ball = 0; ball < planned; ball++) {
    const underPressure = ball >= pressureStart
    const strikeRate = (underPressure ? profile.pressureSr : profile.normalSr) * factor
    const dismissProb = underPressure ? profile.pressureDismissProb : profile.normalDismissProb

    rec.balls += 1
    if (underPressure) {
      rec.pBalls += 1
    } else {
      rec.nBalls += 1
    }

    if (rng() < dismissProb) {
      rec.dismissed = true
      if (underPressure) {
        rec.pDismissed = 1
      } else {
        rec.nDismissed = 1
      }
      break
    }

    const outcome = sampleBallRuns(rng, strikeRate / 100)
    rec.runs += outcome.runs
    if (underPressure) {
      rec.pRuns += outcome.runs
    } else {
      rec.nRuns += outcome.runs
    }
    if (outcome.isBoundary) {
      if (outcome.isSix) {
        rec.sixes += 1
      } else {
        rec.fours += 1
      }
      if (underPressure) {
        rec.pBoundaries += 1
      } else {
        rec.nBoundaries += 1
      }
    }
  }
  return rec
}

function simulateBowlingSpell(rng, profile, factor, innings) {
  const balls = pickWeighted(rng, [6, 12, 18, 24], [0.08, 0.22, 0.3, 0.4])
  const baseShare = innings === 2 ? 0.42 : 0.3
  const share = clamp(randomNormal(rng, baseShare, 0.14), 0, 0.9)
  const pressureStart = Math.floor(balls * (1 - share))

  const rec = {
    balls: balls,
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

  for (let ball = 0; ball < balls; ball++) {
    const underPressure = ball >= pressureStart
    const economy = (underPressure ? profile.pressureEcon : profile.normalEcon) * factor
    const wicketProb = underPressure ? profile.pressureWicketProb : profile.normalWicketProb

    let runs = 0
    let boundary = false
    let wicket = false

    if (rng() < wicketProb) {
      wicket = true
    } else {
      const outcome = sampleBallRuns(rng, economy / 6)
      runs = outcome.runs
      boundary = outcome.isBoundary
    }

    rec.runs += runs
    if (wicket) rec.wickets += 1
    if (runs === 0) rec.dots += 1
    if (boundary) rec.boundaries += 1

    if (underPressure) {
      rec.pBalls += 1
      rec.pRuns += runs
      if (wicket) rec.pWickets += 1
      if (runs === 0) rec.pDots += 1
      if (boundary) rec.pBoundaries += 1
    } else {
      rec.nBalls += 1
      rec.nRuns += runs
      if (wicket) rec.nWickets += 1
      if (runs === 0) rec.nDots += 1
      if (boundary) rec.nBoundaries += 1
    }
  }
  return rec
}

// ---------------------------------------------------------------------------
// Dataset assembly
// ---------------------------------------------------------------------------
function competitionsOf(def) {
  const list = []
  if (def.teams.IPL) list.push('IPL')
  if (def.teams.T20I) list.push('T20I')
  return list
}

function matchesFor(def, matches) {
  const result = []
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const team = def.teams[match.competition]
    if (!team) {
      continue
    }
    if (match.teamA === team) {
      result.push({ match: match, team: team, opposition: match.teamB })
    } else if (match.teamB === team) {
      result.push({ match: match, team: team, opposition: match.teamA })
    }
  }
  return result
}

function buildDataset() {
  const matches = buildMatches()
  const battingRecords = []
  const bowlingRecords = []

  for (let p = 0; p < BATTER_DEFS.length; p++) {
    const def = BATTER_DEFS[p]
    const rng = createRng(1000 + p * 17)
    const profile = buildBatterProfile(rng)
    const share = def.matchShare !== undefined ? def.matchShare : profile.matchShare
    const fixtures = matchesFor(def, matches)

    for (let i = 0; i < fixtures.length; i++) {
      if (rng() > share) {
        continue
      }
      const fixture = fixtures[i]
      const innings = rng() < 0.5 ? 1 : 2
      const factor = COMPETITION_FACTOR[fixture.match.competition]
      const sim = simulateBattingInnings(rng, profile, factor, innings)
      battingRecords.push({
        playerId: def.id,
        matchId: fixture.match.id,
        date: fixture.match.date,
        season: fixture.match.season,
        competition: fixture.match.competition,
        team: fixture.team,
        opposition: fixture.opposition,
        innings: innings,
        ...sim,
      })
    }
  }

  for (let p = 0; p < BOWLER_DEFS.length; p++) {
    const def = BOWLER_DEFS[p]
    const rng = createRng(5000 + p * 31)
    const profile = buildBowlerProfile(rng)
    const share = def.matchShare !== undefined ? def.matchShare : profile.matchShare
    const fixtures = matchesFor(def, matches)

    for (let i = 0; i < fixtures.length; i++) {
      if (rng() > share) {
        continue
      }
      const fixture = fixtures[i]
      const innings = rng() < 0.5 ? 1 : 2
      const factor = COMPETITION_FACTOR[fixture.match.competition]
      const sim = simulateBowlingSpell(rng, profile, factor, innings)
      bowlingRecords.push({
        playerId: def.id,
        matchId: fixture.match.id,
        date: fixture.match.date,
        season: fixture.match.season,
        competition: fixture.match.competition,
        team: fixture.team,
        opposition: fixture.opposition,
        innings: innings,
        ...sim,
      })
    }
  }

  const batters = []
  for (let i = 0; i < BATTER_DEFS.length; i++) {
    batters.push({ id: BATTER_DEFS[i].id, name: BATTER_DEFS[i].name, teams: BATTER_DEFS[i].teams, competitions: competitionsOf(BATTER_DEFS[i]) })
  }
  const bowlers = []
  for (let i = 0; i < BOWLER_DEFS.length; i++) {
    bowlers.push({ id: BOWLER_DEFS[i].id, name: BOWLER_DEFS[i].name, teams: BOWLER_DEFS[i].teams, competitions: competitionsOf(BOWLER_DEFS[i]) })
  }

  return {
    seasons: SEASONS,
    matches: matches,
    batters: batters,
    bowlers: bowlers,
    battingRecords: battingRecords,
    bowlingRecords: bowlingRecords,
  }
}

let cachedDataset = null

export function getDataset() {
  if (cachedDataset === null) {
    cachedDataset = buildDataset()
  }
  return cachedDataset
}
