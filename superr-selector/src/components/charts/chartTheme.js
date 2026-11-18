// Shared chart colours for clean, professional white/light theme.
// Pressure is crisp emerald green, normal play is royal slate blue.
export const CHART_COLORS = {
  pressure: '#10b981',
  normal: '#3b82f6',
  playerA: '#10b981',
  playerB: '#3b82f6',
  grid: '#e2e8f0',
  axis: '#64748b',
  axisLine: '#cbd5e1',
  good: '#10b981',
  warn: '#f59e0b',
  bad: '#ef4444',
  cursor: 'rgba(16, 185, 129, 0.08)',
}

export const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 }

export const LEVEL_COLORS = {
  Low: CHART_COLORS.good,
  Medium: CHART_COLORS.warn,
  High: CHART_COLORS.bad,
}

export const COMPETITION_COLORS = {
  IPL: '#10b981',
  T20I: '#3b82f6',
}
