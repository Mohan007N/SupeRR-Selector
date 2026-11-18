// The module the UI imports for data.
// Automatically falls back to local data if the backend is waking up or not yet configured.
import { DEMO_MODE } from '../config.js'
import * as demoApi from '../data/mockService.js'
import * as httpApi from './httpApi.js'

function wrapEndpoint(httpFn, demoFn) {
  return async function callWithFallback(...args) {
    if (DEMO_MODE) {
      return demoFn(...args)
    }
    try {
      const res = await httpFn(...args)
      // Check if response is HTML (e.g. static host 404 rewrite returning index.html)
      if (typeof res === 'string' && res.trim().startsWith('<')) {
        console.warn('Backend returned HTML instead of JSON (SPA rewrite). Falling back to dataset.')
        return await demoFn(...args)
      }
      return res
    } catch (err) {
      console.warn('Backend API unavailable (' + err.message + '). Falling back to dataset.')
      return await demoFn(...args)
    }
  }
}

export const getFilterOptions = wrapEndpoint(httpApi.getFilterOptions, demoApi.getFilterOptions)
export const getPlayerDirectory = wrapEndpoint(httpApi.getPlayerDirectory, demoApi.getPlayerDirectory)
export const getOverview = wrapEndpoint(httpApi.getOverview, demoApi.getOverview)
export const getPlayerTable = wrapEndpoint(httpApi.getPlayerTable, demoApi.getPlayerTable)
export const getLeaderboard = wrapEndpoint(httpApi.getLeaderboard, demoApi.getLeaderboard)
export const getPlayerProfile = wrapEndpoint(httpApi.getPlayerProfile, demoApi.getPlayerProfile)
export const getComparison = wrapEndpoint(httpApi.getComparison, demoApi.getComparison)
export const getPressureBins = wrapEndpoint(httpApi.getPressureBins, demoApi.getPressureBins)
export const getMethodology = wrapEndpoint(httpApi.getMethodology, demoApi.getMethodology)
