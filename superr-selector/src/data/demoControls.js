import { DEMO_LATENCY_MS } from '../config.js'

// Mutable switches for the demo data service. The UI exposes "Simulate API error"
// so loading / error / retry states can be shown during a presentation.
export const demoControls = {
  simulateError: false,
  latencyMs: DEMO_LATENCY_MS,
}
