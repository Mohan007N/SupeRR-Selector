import Badge, { ConfidenceBadge, DeltaBadge, RatingPill } from '../ui/Badge.jsx'
import { formatNumber, formatPercent } from '../../utils/format.js'

function teamText(row) {
  return row.teams.join(', ')
}

function competitionBadges(row) {
  return (
    <span className="flex gap-1">
      {row.competitions.map(function renderComp(name) {
        return (
          <Badge key={name} tone={name === 'IPL' ? 'accent' : 'info'}>
            {name}
          </Badge>
        )
      })}
    </span>
  )
}

function playerNameCell(row) {
  return (
    <div className="flex items-center gap-1.5">
      {row.isShortlisted ? (
        <span className="flex h-5 px-1 shrink-0 items-center justify-center rounded-md bg-accent/20 font-mono text-[10px] font-bold text-accent" title={`Shortlist #${row.rank}`}>
          #{row.rank}
        </span>
      ) : null}
      <span className="truncate font-semibold">{row.name}</span>
    </div>
  )
}

function sharedLeading() {
  return [
    { key: 'name', header: 'Player', accessor: (row) => row.name, render: playerNameCell, sticky: true, width: '190px' },
    { key: 'team', header: 'Team', accessor: teamText, render: teamText },
    { key: 'competition', header: 'Comp.', accessor: (row) => row.competitions.join(','), render: competitionBadges },
    { key: 'matches', header: 'Mat', accessor: (row) => row.matches, align: 'right', tooltip: 'Matches in the current filter' },
  ]
}

function sharedTrailing(minRatingLabel) {
  return [
    {
      key: 'pressureBalls',
      header: 'Pressure balls',
      accessor: (row) => row.pressureBalls,
      render: (row) => formatNumber(row.pressureBalls),
      align: 'right',
      tooltip: 'Sample size: deliveries that met the pressure definition',
    },
    {
      key: 'rating',
      header: minRatingLabel,
      accessor: (row) => row.rating,
      render: (row) => <RatingPill value={row.rating} />,
      align: 'right',
      tooltip: '0-100 rating, 50 = league average for the current filters. Demo formula, not validated.',
    },
    {
      key: 'confidence',
      header: 'Confidence',
      accessor: (row) => row.reliability,
      render: (row) => <ConfidenceBadge level={row.confidence} type={row.type} pressureBalls={row.pressureBalls} />,
    },
  ]
}

export function battingColumns() {
  return [
    ...sharedLeading(),
    { key: 'runs', header: 'Runs', accessor: (row) => row.runs, render: (row) => formatNumber(row.runs), align: 'right' },
    { key: 'balls', header: 'Balls', accessor: (row) => row.balls, render: (row) => formatNumber(row.balls), align: 'right' },
    { key: 'sr', header: 'SR', accessor: (row) => row.strikeRate, render: (row) => formatNumber(row.strikeRate, 1), align: 'right', tooltip: 'Runs per 100 balls' },
    { key: 'avg', header: 'Avg', accessor: (row) => row.average, render: (row) => formatNumber(row.average, 1), align: 'right', tooltip: 'Runs per dismissal' },
    { key: 'boundaryPct', header: 'Bdry %', accessor: (row) => row.boundaryPct, render: (row) => formatPercent(row.boundaryPct, 1), align: 'right' },
    { key: 'dismissalRate', header: 'Dis/100', accessor: (row) => row.dismissalRate, render: (row) => formatNumber(row.dismissalRate, 2), align: 'right', defaultDirection: 'asc', tooltip: 'Dismissals per 100 balls (lower is better)' },
    { key: 'pSr', header: 'Pressure SR', accessor: (row) => row.pressureStrikeRate, render: (row) => formatNumber(row.pressureStrikeRate, 1), align: 'right' },
    { key: 'nSr', header: 'Normal SR', accessor: (row) => row.normalStrikeRate, render: (row) => formatNumber(row.normalStrikeRate, 1), align: 'right' },
    { key: 'improvement', header: 'Δ SR', accessor: (row) => row.pressureImprovement, render: (row) => <DeltaBadge value={row.pressureImprovement} digits={1} />, align: 'right', tooltip: 'Pressure SR minus normal SR' },
    ...sharedTrailing('Rating'),
  ]
}

export function bowlingColumns() {
  return [
    ...sharedLeading(),
    { key: 'wickets', header: 'Wkts', accessor: (row) => row.wickets, render: (row) => formatNumber(row.wickets), align: 'right' },
    { key: 'legalBalls', header: 'Legal balls', accessor: (row) => row.legalBalls, render: (row) => formatNumber(row.legalBalls), align: 'right' },
    { key: 'economy', header: 'Econ', accessor: (row) => row.economy, render: (row) => formatNumber(row.economy, 2), align: 'right', defaultDirection: 'asc', tooltip: 'Runs per over (lower is better)' },
    { key: 'wicketRate', header: 'Wkts/24', accessor: (row) => row.wicketRate, render: (row) => formatNumber(row.wicketRate, 2), align: 'right', tooltip: 'Wickets per 24 legal balls' },
    { key: 'dotPct', header: 'Dot %', accessor: (row) => row.dotPct, render: (row) => formatPercent(row.dotPct, 1), align: 'right' },
    { key: 'boundaryPctConceded', header: 'Bdry % conc.', accessor: (row) => row.boundaryPctConceded, render: (row) => formatPercent(row.boundaryPctConceded, 1), align: 'right', defaultDirection: 'asc' },
    { key: 'pEcon', header: 'Pressure econ', accessor: (row) => row.pressureEconomy, render: (row) => formatNumber(row.pressureEconomy, 2), align: 'right', defaultDirection: 'asc' },
    { key: 'nEcon', header: 'Normal econ', accessor: (row) => row.normalEconomy, render: (row) => formatNumber(row.normalEconomy, 2), align: 'right', defaultDirection: 'asc' },
    { key: 'improvement', header: 'Δ Econ', accessor: (row) => row.improvement, render: (row) => <DeltaBadge value={row.improvement} digits={2} />, align: 'right', tooltip: 'Normal economy minus pressure economy. Positive = better under pressure.' },
    ...sharedTrailing('Rating'),
  ]
}

// CSV columns. Plain values only, no formatting, so spreadsheets can sort and calculate.
export function battingCsvColumns() {
  return [
    { header: 'Player', value: (r) => r.name },
    { header: 'Team', value: (r) => r.teams.join('; ') },
    { header: 'Competition', value: (r) => r.competitions.join('; ') },
    { header: 'Matches', value: (r) => r.matches },
    { header: 'Runs', value: (r) => r.runs },
    { header: 'Balls faced', value: (r) => r.balls },
    { header: 'Strike rate', value: (r) => round(r.strikeRate, 2) },
    { header: 'Average', value: (r) => round(r.average, 2) },
    { header: 'Boundary %', value: (r) => round(r.boundaryPct, 2) },
    { header: 'Dismissals per 100 balls', value: (r) => round(r.dismissalRate, 3) },
    { header: 'Pressure balls', value: (r) => r.pressureBalls },
    { header: 'Pressure strike rate', value: (r) => round(r.pressureStrikeRate, 2) },
    { header: 'Normal strike rate', value: (r) => round(r.normalStrikeRate, 2) },
    { header: 'Pressure improvement (SR pts)', value: (r) => round(r.pressureImprovement, 2) },
    { header: 'Pressure rating', value: (r) => round(r.rating, 2) },
    { header: 'Reliability %', value: (r) => round(r.reliability, 1) },
    { header: 'Confidence', value: (r) => r.confidence },
  ]
}

export function bowlingCsvColumns() {
  return [
    { header: 'Player', value: (r) => r.name },
    { header: 'Team', value: (r) => r.teams.join('; ') },
    { header: 'Competition', value: (r) => r.competitions.join('; ') },
    { header: 'Matches', value: (r) => r.matches },
    { header: 'Wickets', value: (r) => r.wickets },
    { header: 'Legal balls', value: (r) => r.legalBalls },
    { header: 'Economy', value: (r) => round(r.economy, 3) },
    { header: 'Wickets per 24 balls', value: (r) => round(r.wicketRate, 3) },
    { header: 'Dot-ball %', value: (r) => round(r.dotPct, 2) },
    { header: 'Boundary % conceded', value: (r) => round(r.boundaryPctConceded, 2) },
    { header: 'Pressure balls', value: (r) => r.pressureBalls },
    { header: 'Pressure economy', value: (r) => round(r.pressureEconomy, 3) },
    { header: 'Normal economy', value: (r) => round(r.normalEconomy, 3) },
    { header: 'Economy improvement', value: (r) => round(r.improvement, 3) },
    { header: 'Pressure rating', value: (r) => round(r.rating, 2) },
    { header: 'Reliability %', value: (r) => round(r.reliability, 1) },
    { header: 'Confidence', value: (r) => r.confidence },
  ]
}

function round(value, digits) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return ''
  }
  const factor = Math.pow(10, digits)
  return Math.round(value * factor) / factor
}

export function exportPreamble(meta, filters, extra) {
  const lines = []
  lines.push('SupeRR Selector - Season 2 export')
  if (meta && meta.isDemo) {
    lines.push('DEMO DATA: synthetic figures, not verified results.')
  }
  lines.push(
    'Filters: competition=' + filters.competition + ', season=' + filters.season +
      (filters.dateFrom ? ', from=' + filters.dateFrom : '') + (filters.dateTo ? ', to=' + filters.dateTo : ''),
  )
  lines.push('Exported: ' + new Date().toISOString())
  if (extra) {
    lines.push(extra)
  }
  return lines
}
