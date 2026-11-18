import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { AXIS_TICK, CHART_COLORS, LEVEL_COLORS } from './chartTheme.js'
import { formatNumber, formatPercent } from '../../utils/format.js'

// distribution = [{ level, count, share }]
export function PressureDistributionChart({ distribution }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={distribution} margin={{ top: 20, right: 8, bottom: 4, left: 0 }} barCategoryGap="28%">
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="level" tick={AXIS_TICK} axisLine={{ stroke: CHART_COLORS.axisLine }} tickLine={false} />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={44}
          unit="%"
          domain={[0, 100]}
        />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={function label(value) {
                return value + ' pressure'
              }}
              valueFormatter={function format(value, item) {
                return formatPercent(value, 1) + ' · ' + formatNumber(item.payload.count) + ' deliveries'
              }}
            />
          }
          cursor={{ fill: CHART_COLORS.cursor }}
        />
        <Bar
          dataKey="share"
          name="Share of deliveries"
          radius={[6, 6, 0, 0]}
          label={{
            position: 'top',
            fill: '#cbd5e6',
            fontSize: 12,
            formatter: function formatLabel(value) {
              return formatNumber(value, 1) + '%'
            },
          }}
        >
          {distribution.map(function renderCell(entry) {
            return <Cell key={entry.level} fill={LEVEL_COLORS[entry.level]} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// byOver = [{ over, meanIndex, highShare }]
export function PressureByOverChart({ byOver, thresholds }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={byOver} margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="over"
          tick={AXIS_TICK}
          axisLine={{ stroke: CHART_COLORS.axisLine }}
          tickLine={false}
          interval={1}
          label={{ value: 'Over', position: 'insideBottom', offset: -10, fill: CHART_COLORS.axis, fontSize: 11 }}
        />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} domain={[0, 100]} />
        <ReferenceLine y={thresholds.lowMax} stroke={CHART_COLORS.good} strokeDasharray="4 4" />
        <ReferenceLine y={thresholds.mediumMax} stroke={CHART_COLORS.bad} strokeDasharray="4 4" />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={function label(value) {
                return 'Over ' + value
              }}
              valueFormatter={function format(value) {
                return formatNumber(value, 1)
              }}
            />
          }
        />
        <Line type="monotone" dataKey="meanIndex" name="Mean pressure index" stroke={CHART_COLORS.pressure} strokeWidth={2.5} dot={{ r: 2.5, fill: CHART_COLORS.pressure }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

function heatColor(index) {
  // 0 -> green, 100 -> red, via amber. Hue 140 to 0.
  const clamped = Math.max(0, Math.min(100, index))
  const hue = 140 - (clamped / 100) * 140
  return 'hsl(' + hue.toFixed(0) + ' 62% 44%)'
}

// grid = [{ over, wickets, meanIndex, count }]
export function PressureHeatmap({ grid }) {
  const lookup = {}
  for (let i = 0; i < grid.length; i++) {
    lookup[grid[i].over + '|' + grid[i].wickets] = grid[i]
  }

  const overs = []
  for (let o = 1; o <= 20; o++) {
    overs.push(o)
  }
  const wicketRows = []
  for (let w = 0; w <= 9; w++) {
    wicketRows.push(w)
  }

  return (
    <div className="overflow-x-auto">
      <div
        role="img"
        aria-label="Heatmap of mean pressure index by over (columns) and wickets lost (rows). Green is low pressure, red is high."
        className="min-w-[520px]"
      >
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: '28px repeat(20, minmax(0, 1fr))' }}>
          {wicketRows.map(function renderRow(w) {
            const cells = [
              <div key={'label-' + w} className="num flex items-center justify-end pr-1.5 text-[10px] text-muted">
                {w}
              </div>,
            ]
            for (let i = 0; i < overs.length; i++) {
              const cell = lookup[overs[i] + '|' + w]
              if (!cell || cell.count < 3) {
                cells.push(<div key={w + '-' + overs[i]} className="aspect-square rounded-[3px] bg-bg-raised" />)
              } else {
                cells.push(
                  <div
                    key={w + '-' + overs[i]}
                    className="aspect-square rounded-[3px]"
                    style={{ backgroundColor: heatColor(cell.meanIndex) }}
                    title={'Over ' + overs[i] + ', ' + w + ' down: index ' + cell.meanIndex.toFixed(1) + ' (' + cell.count + ' deliveries)'}
                  />,
                )
              }
            }
            return cells
          })}
          <div />
          {overs.map(function renderOver(o) {
            return (
              <div key={'o-' + o} className="num text-center text-[10px] text-muted">
                {o % 2 === 1 || o === 20 ? o : ''}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
          <span>Rows: wickets lost · Columns: over</span>
          <span className="flex items-center gap-2">
            Low
            <span
              className="h-2 w-28 rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(140 62% 44%), hsl(70 62% 44%), hsl(0 62% 44%))' }}
              aria-hidden="true"
            />
            High
          </span>
        </div>
      </div>
    </div>
  )
}
