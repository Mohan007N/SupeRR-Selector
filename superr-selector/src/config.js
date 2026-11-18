// Central runtime configuration. Everything here can be overridden with Vite env variables.
const env = import.meta.env || {}

export const APP_NAME = 'SupeRR Selector'
export const APP_SEASON = 'Season 2'

// DEMO_MODE = true  -> data comes from src/data (synthetic, clearly labelled).
// DEMO_MODE = false -> data comes from the FastAPI backend at VITE_API_BASE_URL.
export const DEMO_MODE = String(env.VITE_DEMO_MODE ?? 'true').toLowerCase() !== 'false'

export const API_BASE_URL = env.VITE_API_BASE_URL || '/api/v1'

// Artificial latency for demo requests so loading states are visible.
export const DEMO_LATENCY_MS = 350

export const COMPETITIONS = ['All', 'IPL', 'T20I']
