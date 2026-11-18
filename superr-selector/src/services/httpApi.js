// Production implementation of the API contract. Used when DEMO_MODE is false.
// Endpoint paths are listed in README.md under "Backend integration".
import { apiClient } from './apiClient.js'

function filterParams(filters) {
  const params = {}
  if (filters && filters.competition && filters.competition !== 'All') {
    params.competition = filters.competition
  }
  if (filters && filters.season && filters.season !== 'All') {
    params.season = filters.season
  }
  if (filters && filters.dateFrom) {
    params.date_from = filters.dateFrom
  }
  if (filters && filters.dateTo) {
    params.date_to = filters.dateTo
  }
  return params
}

async function get(path, params) {
  const response = await apiClient.get(path, { params: params })
  return response.data
}

export function getFilterOptions() {
  return get('/filters')
}

export function getPlayerDirectory() {
  return get('/players')
}

export function getOverview(filters) {
  return get('/overview', filterParams(filters))
}

export function getPlayerTable(type, filters) {
  return get('/' + type, filterParams(filters))
}

export function getLeaderboard(type, filters, options) {
  const params = filterParams(filters)
  if (options && options.minPressureBalls !== undefined) {
    params.min_pressure_balls = options.minPressureBalls
  }
  if (options && options.confidence && options.confidence !== 'All') {
    params.confidence = options.confidence
  }
  return get('/rankings/' + type, params)
}

export function getPlayerProfile(type, id, filters) {
  return get('/players/' + type + '/' + encodeURIComponent(id), filterParams(filters))
}

export function getComparison(type, idA, idB, filters) {
  const params = filterParams(filters)
  params.a = idA
  params.b = idB
  return get('/comparison/' + type, params)
}

export function getPressureBins(filters) {
  const params = {}
  if (filters && filters.competition && filters.competition !== 'All') {
    params.competition = filters.competition
  }
  return get('/pressure/bins', params)
}

export function getMethodology() {
  return get('/methodology')
}
