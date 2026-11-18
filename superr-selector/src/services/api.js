// The only module the UI imports for data. It picks the demo or HTTP implementation
// from DEMO_MODE, so pages never know which one they are talking to.
import { DEMO_MODE } from '../config.js'
import * as demoApi from '../data/mockService.js'
import * as httpApi from './httpApi.js'

const implementation = DEMO_MODE ? demoApi : httpApi

export const getFilterOptions = implementation.getFilterOptions
export const getPlayerDirectory = implementation.getPlayerDirectory
export const getOverview = implementation.getOverview
export const getPlayerTable = implementation.getPlayerTable
export const getLeaderboard = implementation.getLeaderboard
export const getPlayerProfile = implementation.getPlayerProfile
export const getComparison = implementation.getComparison
export const getPressureBins = implementation.getPressureBins
export const getMethodology = implementation.getMethodology
