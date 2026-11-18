import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { AXIS_TICK, CHART_COLORS } from './chartTheme.js'
import { formatNumber } from '../../utils/format.js'

// data = [{ season, pressure, normal }]
export default function SeasonTrendChart({ data, digits = 1 }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="season" tick={AXIS_TICK} axisLine={{ stroke: CHART_COLORS.axisLine }} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} domain={['auto', 'auto']} tickFormatter={function tick(v) {
          return formatNumber(v, digits > 1 ? 1 : 0)
        }} />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={function label(value) {
                return 'Season ' + value
              }}
              valueFormatter={function format(value) {
                return formatNumber(value, digits)
              }}
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} iconType="circle" iconSize={8} />
        <Line type="monotone" dataKey="pressure" name="Pressure" stroke={CHART_COLORS.pressure} strokeWidth={2.5} dot={{ r: 3, fill: CHART_COLORS.pressure }} activeDot={{ r: 5 }} connectNulls />
        <Line type="monotone" dataKey="normal" name="Normal" stroke={CHART_COLORS.normal} strokeWidth={2.5} dot={{ r: 3, fill: CHART_COLORS.normal }} activeDot={{ r: 5 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
