import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, CHART_COLORS } from './chartTheme.js'
import { formatNumber } from '../../utils/format.js'

function ScatterTooltip({ active, payload, digits, betterWhenLower }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const point = payload[0].payload
  const diff = point.y - point.x
  const better = betterWhenLower ? diff < 0 : diff > 0
  return (
    <div className="rounded-lg border border-line-strong bg-panel-3 px-3 py-2 text-xs shadow-lg shadow-black/40">
      <p className="mb-1 font-medium text-fg">{point.name}</p>
      <p className="text-fg-soft">
        Normal: <span className="num font-medium text-fg">{formatNumber(point.x, digits)}</span>
      </p>
      <p className="text-fg-soft">
        Pressure: <span className="num font-medium text-fg">{formatNumber(point.y, digits)}</span>
      </p>
      <p className={better ? 'text-good' : 'text-bad'}>{better ? 'Better under pressure' : 'Worse under pressure'}</p>
      <p className="mt-1 text-faint">Click to open profile</p>
    </div>
  )
}

// rows: [{ id, name, x (normal), y (pressure) }]. Points on the diagonal perform the same either way.
export default function PressureScatter({ rows, onSelect, digits = 1, betterWhenLower = false, axisLabelX, axisLabelY }) {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < rows.length; i++) {
    min = Math.min(min, rows[i].x, rows[i].y)
    max = Math.max(max, rows[i].x, rows[i].y)
  }
  const lower = Math.floor(min - 2)
  const upper = Math.ceil(max + 2)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 4 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[lower, upper]}
          tick={AXIS_TICK}
          axisLine={{ stroke: CHART_COLORS.axisLine }}
          tickLine={false}
          label={{ value: axisLabelX, position: 'insideBottom', offset: -14, fill: CHART_COLORS.axis, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[lower, upper]}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={48}
          label={{ value: axisLabelY, angle: -90, position: 'insideLeft', fill: CHART_COLORS.axis, fontSize: 11, dx: 6 }}
        />
        <ReferenceLine
          segment={[
            { x: lower, y: lower },
            { x: upper, y: upper },
          ]}
          stroke={CHART_COLORS.axisLine}
          strokeDasharray="5 5"
        />
        <Tooltip cursor={{ strokeDasharray: '3 3', stroke: CHART_COLORS.axisLine }} content={<ScatterTooltip digits={digits} betterWhenLower={betterWhenLower} />} />
        <Scatter
          data={rows}
          fill={CHART_COLORS.pressure}
          fillOpacity={0.85}
          cursor="pointer"
          onClick={function click(point) {
            const target = point && point.payload ? point.payload : point
            if (target && onSelect) {
              onSelect(target)
            }
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
