import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { AXIS_TICK, CHART_COLORS } from './chartTheme.js'
import { formatNumber } from '../../utils/format.js'

// data = [{ name, a, b }]
export function ComparisonBars({ data, nameA, nameB, digits = 1, domain }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barGap={4} barCategoryGap="30%">
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={{ stroke: CHART_COLORS.axisLine }} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} domain={domain || [0, 'auto']} />
        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={function format(value) {
                return formatNumber(value, digits)
              }}
            />
          }
          cursor={{ fill: CHART_COLORS.cursor }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} iconType="circle" iconSize={8} />
        <Bar dataKey="a" name={nameA} fill={CHART_COLORS.playerA} radius={[4, 4, 0, 0]} />
        <Bar dataKey="b" name={nameB} fill={CHART_COLORS.playerB} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// data = [{ axis, a, b }] with values as percentiles from 0 to 100.
export function ComparisonRadar({ data, nameA, nameB }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={CHART_COLORS.grid} />
        <PolarAngleAxis dataKey="axis" tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} axisLine={false} tickCount={5} />
        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={function format(value) {
                return 'P' + formatNumber(value, 0)
              }}
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} iconType="circle" iconSize={8} />
        <Radar name={nameA} dataKey="a" stroke={CHART_COLORS.playerA} fill={CHART_COLORS.playerA} fillOpacity={0.22} strokeWidth={2} />
        <Radar name={nameB} dataKey="b" stroke={CHART_COLORS.playerB} fill={CHART_COLORS.playerB} fillOpacity={0.22} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
