import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { AXIS_TICK, CHART_COLORS } from './chartTheme.js'
import { formatNumber, formatShortDate } from '../../utils/format.js'

// Match-wise consistency.
//  batting: bars = runs, line = strike rate
//  bowling: bars = wickets, line = economy
export default function ConsistencyChart({ matchLog, type }) {
  const data = []
  let total = 0
  for (let i = 0; i < matchLog.length; i++) {
    const m = matchLog[i]
    const barValue = type === 'batting' ? m.runs : m.wickets
    total += barValue
    data.push({
      date: m.date,
      label: formatShortDate(m.date) + ' v ' + m.opposition,
      bar: barValue,
      line: type === 'batting' ? m.strikeRate : m.economy,
    })
  }
  const average = data.length > 0 ? total / data.length : 0

  const barName = type === 'batting' ? 'Runs' : 'Wickets'
  const lineName = type === 'batting' ? 'Strike rate' : 'Economy'

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          axisLine={{ stroke: CHART_COLORS.axisLine }}
          tickLine={false}
          tickFormatter={function tick(value) {
            return formatShortDate(value)
          }}
          minTickGap={36}
        />
        <YAxis yAxisId="left" tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
        <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={function label(value, payload) {
                return payload && payload[0] ? payload[0].payload.label : value
              }}
              valueFormatter={function format(value, item) {
                return formatNumber(value, item.dataKey === 'bar' ? 0 : 1)
              }}
            />
          }
          cursor={{ fill: CHART_COLORS.cursor }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} iconType="circle" iconSize={8} />
        <Bar yAxisId="left" dataKey="bar" name={barName} fill={CHART_COLORS.pressure} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="line" name={lineName} stroke={CHART_COLORS.normal} strokeWidth={2} dot={false} connectNulls />
        <ReferenceLine yAxisId="left" y={average} stroke={CHART_COLORS.warn} strokeDasharray="4 4" label={{ value: 'avg ' + formatNumber(average, 1), fill: CHART_COLORS.warn, fontSize: 11, position: 'insideTopRight' }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
