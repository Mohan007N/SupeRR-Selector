import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { AXIS_TICK, CHART_COLORS } from './chartTheme.js'
import { formatNumber } from '../../utils/format.js'

function shortName(name) {
  if (name.length <= 16) {
    return name
  }
  return name.slice(0, 15) + '…'
}

// Grouped bars: pressure vs normal. data = [{ name, pressure, normal }]
// horizontal = names on the Y axis (better for player names).
export default function PressureNormalChart({ data, digits = 1, horizontal = false, pressureLabel = 'Pressure', normalLabel = 'Normal', unitLabel }) {
  const formatter = function format(value) {
    return formatNumber(value, digits)
  }

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} axisLine={{ stroke: CHART_COLORS.axisLine }} tickLine={false} domain={[0, 'auto']} />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tick={AXIS_TICK}
            tickFormatter={shortName}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <Tooltip content={<ChartTooltip valueFormatter={formatter} />} cursor={{ fill: CHART_COLORS.cursor }} />
          <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} iconType="circle" iconSize={8} />
          <Bar dataKey="pressure" name={pressureLabel} fill={CHART_COLORS.pressure} radius={[0, 4, 4, 0]} />
          <Bar dataKey="normal" name={normalLabel} fill={CHART_COLORS.normal} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barGap={4} barCategoryGap="28%">
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={{ stroke: CHART_COLORS.axisLine }} tickLine={false} />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={44}
          domain={[0, 'auto']}
          label={unitLabel ? { value: unitLabel, angle: -90, position: 'insideLeft', fill: CHART_COLORS.axis, fontSize: 11, dx: 4 } : undefined}
        />
        <Tooltip content={<ChartTooltip valueFormatter={formatter} />} cursor={{ fill: CHART_COLORS.cursor }} />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} iconType="circle" iconSize={8} />
        <Bar dataKey="pressure" name={pressureLabel} fill={CHART_COLORS.pressure} radius={[4, 4, 0, 0]} />
        <Bar dataKey="normal" name={normalLabel} fill={CHART_COLORS.normal} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
