// Shared chart colours. Pressure is always lime, normal play is always slate blue.
export const CHART_COLORS = {
  pressure: '#a3e635',
  normal: '#7aa2ff',
  playerA: '#a3e635',
  playerB: '#7aa2ff',
  grid: '#1f2e4a',
  axis: '#8f9db8',
  axisLine: '#2c3f63',
  good: '#34d399',
  warn: '#fbbf24',
  bad: '#f87171',
  cursor: 'rgba(163, 230, 53, 0.06)',
}

export const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 }

export const LEVEL_COLORS = {
  Low: CHART_COLORS.good,
  Medium: CHART_COLORS.warn,
  High: CHART_COLORS.bad,
}

export const COMPETITION_COLORS = {
  IPL: '#a3e635',
  T20I: '#7aa2ff',
}
