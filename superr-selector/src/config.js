// Central runtime configuration. Everything here can be overridden with Vite env variables.
const env = import.meta.env || {}

export const APP_NAME = 'SupeRR Selector'
export const APP_SEASON = 'Season 2'

function getApiBaseUrl() {
  let url = (env.VITE_API_BASE_URL || '/api/v1').trim()
  url = url.replace(/\/+$/, '')
  // If user provided host URL like https://app.onrender.com without /api/v1, normalize it
  if (url.startsWith('http') && !url.includes('/api/v1')) {
    url = url + '/api/v1'
  }
  return url
}

export const API_BASE_URL = getApiBaseUrl()

// If an external backend URL is provided (http/https), or if running locally with dev proxy,
// DEMO_MODE defaults to false so it talks to the FastAPI backend.
// Otherwise in static production without a backend URL, it gracefully uses local dataset.
const hasConfiguredBackend =
  API_BASE_URL.startsWith('http://') ||
  API_BASE_URL.startsWith('https://') ||
  Boolean(env.DEV)

export const DEMO_MODE =
  env.VITE_DEMO_MODE !== undefined
    ? String(env.VITE_DEMO_MODE).toLowerCase() === 'true'
    : !hasConfiguredBackend

// Artificial latency for demo requests so loading states are visible.
export const DEMO_LATENCY_MS = 200

export const COMPETITIONS = ['All', 'IPL', 'T20I']
