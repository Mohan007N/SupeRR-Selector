import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { COMPETITION_COLORS } from './chartTheme.js'
import { formatNumber, formatPercent } from '../../utils/format.js'

// data = [{ name, value }] where name is a competition.
export default function CompetitionDonut({ data, centerLabel, valueLabel }) {
  let total = 0
  for (let i = 0; i < data.length; i++) {
    total += data[i].value
  }

  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div className="relative min-h-0 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={function format(value) {
                    return formatNumber(value) + ' (' + formatPercent(total > 0 ? (value * 100) / total : 0, 1) + ')'
                  }}
                />
              }
            />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={data.length > 1 ? 3 : 0} stroke="none">
              {data.map(function renderCell(entry) {
                return <Cell key={entry.name} fill={COMPETITION_COLORS[entry.name] || '#64748b'} />
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num font-display text-xl font-semibold text-fg">{formatNumber(total)}</span>
          <span className="text-[11px] text-muted">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-2" aria-label={valueLabel}>
        {data.map(function renderLegend(entry) {
          return (
            <li key={entry.name} className="flex items-center gap-2 text-[13px]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COMPETITION_COLORS[entry.name] || '#64748b' }} aria-hidden="true" />
              <span className="text-fg-soft">{entry.name}</span>
              <span className="num ml-auto text-fg">{formatPercent(total > 0 ? (entry.value * 100) / total : 0, 0)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
