import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import AsyncView from '../ui/AsyncView.jsx'
import { TableSkeleton } from '../ui/Skeleton.jsx'
import { EmptyState } from '../ui/States.jsx'
import { SelectField, SliderField } from '../ui/Controls.jsx'
import Badge, { ConfidenceBadge, RatingPill } from '../ui/Badge.jsx'
import DataTable from './DataTable.jsx'
import { exportPreamble } from './playerColumns.jsx'
import { getLeaderboard } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { useFilters } from '../../context/FilterContext.jsx'
import { useProfile } from '../../context/ProfileContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { MIN_PRESSURE_BALLS } from '../../utils/stats.js'
import { downloadCsv } from '../../utils/csv.js'
import { formatNumber, initials } from '../../utils/format.js'

const CONFIDENCE_OPTIONS = [
  { value: 'All', label: 'All confidence' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
]

// Podium styling: rank 1 uses the lime accent, 2 and 3 stay in neutral slate tones.
const PODIUM = {
  1: { ring: 'border-accent-line bg-accent-soft', badge: 'bg-accent text-bg', lift: 'md:-translate-y-3', label: '1st' },
  2: { ring: 'border-line-strong bg-panel-2', badge: 'bg-fg-soft text-bg', lift: '', label: '2nd' },
  3: { ring: 'border-line-strong bg-panel-2', badge: 'bg-line-strong text-fg', lift: 'md:translate-y-2', label: '3rd' },
}

function PodiumCard({ row, type, onOpen, index }) {
  const style = PODIUM[row.rank]
  const metricLabel = type === 'batting' ? 'Pressure SR' : 'Pressure econ'
  const metricValue = type === 'batting' ? formatNumber(row.pressureStrikeRate, 1) : formatNumber(row.pressureEconomy, 2)
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(row)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.07 }}
      aria-label={'Rank ' + row.rank + ': ' + row.name + '. Open profile.'}
      className={'group rounded-2xl border p-4 text-left transition-colors hover:border-accent-line ' + style.ring + ' ' + style.lift}
    >
      <div className="flex items-center justify-between">
        <span className={'rounded-full px-2.5 py-0.5 font-display text-xs font-semibold ' + style.badge}>{style.label}</span>
        <ConfidenceBadge level={row.confidence} type={type} pressureBalls={row.pressureBalls} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-bg-raised font-display text-sm font-semibold text-fg">
          {initials(row.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold text-fg group-hover:text-accent">{row.name}</p>
          <p className="truncate text-xs text-muted">
            {row.teams.join(', ')} · {row.competitions.join(', ')}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-faint">Rating</dt>
          <dd className="num mt-0.5 font-display text-lg font-semibold text-accent">{formatNumber(row.rating, 1)}</dd>
        </div>
        <div>
          <dt className="text-faint">{metricLabel}</dt>
          <dd className="num mt-0.5 font-display text-lg font-semibold text-fg">{metricValue}</dd>
        </div>
        <div>
          <dt className="text-faint">Sample</dt>
          <dd className="num mt-0.5 font-display text-lg font-semibold text-fg">{formatNumber(row.pressureBalls)}</dd>
        </div>
      </dl>
    </motion.button>
  )
}

function ReliabilityMeter({ value }) {
  const tone = value >= 60 ? 'bg-good' : value >= 40 ? 'bg-warn' : 'bg-bad'
  return (
    <div className="flex items-center gap-2" title={formatNumber(value, 0) + '% reliability'}>
      <div className="h-1.5 w-16 rounded-full bg-panel-3" role="img" aria-label={formatNumber(value, 0) + ' percent reliability'}>
        <div className={'h-1.5 rounded-full ' + tone} style={{ width: Math.min(100, value) + '%' }} />
      </div>
      <span className="num text-xs text-muted">{formatNumber(value, 0)}%</span>
    </div>
  )
}

function buildColumns(type) {
  return [
    { key: 'rank', header: '#', accessor: (r) => r.rank, defaultDirection: 'asc', render: (r) => <span className="num font-display font-semibold text-muted">{r.rank}</span> },
    { key: 'name', header: 'Player', accessor: (r) => r.name, width: '160px' },
    { key: 'team', header: 'Team', accessor: (r) => r.teams.join(', ') },
    {
      key: 'competition',
      header: 'Comp.',
      accessor: (r) => r.competitions.join(','),
      render: (r) => (
        <span className="flex gap-1">
          {r.competitions.map((c) => (
            <Badge key={c} tone={c === 'IPL' ? 'accent' : 'info'}>
              {c}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'metric',
      header: type === 'batting' ? 'Pressure SR' : 'Pressure econ',
      accessor: (r) => (type === 'batting' ? r.pressureStrikeRate : r.pressureEconomy),
      render: (r) => (type === 'batting' ? formatNumber(r.pressureStrikeRate, 1) : formatNumber(r.pressureEconomy, 2)),
      align: 'right',
      defaultDirection: type === 'batting' ? 'desc' : 'asc',
    },
    { key: 'rating', header: 'Rating', accessor: (r) => r.rating, render: (r) => <RatingPill value={r.rating} />, align: 'right', tooltip: 'Demo pressure rating, 50 = league average' },
    { key: 'sample', header: 'Sample', accessor: (r) => r.pressureBalls, render: (r) => formatNumber(r.pressureBalls) + ' balls', align: 'right' },
    { key: 'reliability', header: 'Reliability', accessor: (r) => r.reliability, render: (r) => <ReliabilityMeter value={r.reliability} />, tooltip: 'pressure balls / (pressure balls + prior)' },
    { key: 'confidence', header: 'Confidence', accessor: (r) => r.reliability, render: (r) => <ConfidenceBadge level={r.confidence} type={type} pressureBalls={r.pressureBalls} /> },
  ]
}

function csvColumns(type) {
  const common = [
    { header: 'Rank', value: (r) => r.rank },
    { header: 'Player', value: (r) => r.name },
    { header: 'Team', value: (r) => r.teams.join('; ') },
    { header: 'Competition', value: (r) => r.competitions.join('; ') },
  ]
  const metric =
    type === 'batting'
      ? [
          { header: 'Pressure strike rate', value: (r) => (r.pressureStrikeRate === null ? '' : Number(r.pressureStrikeRate.toFixed(2))) },
          { header: 'Normal strike rate', value: (r) => (r.normalStrikeRate === null ? '' : Number(r.normalStrikeRate.toFixed(2))) },
        ]
      : [
          { header: 'Pressure economy', value: (r) => (r.pressureEconomy === null ? '' : Number(r.pressureEconomy.toFixed(3))) },
          { header: 'Normal economy', value: (r) => (r.normalEconomy === null ? '' : Number(r.normalEconomy.toFixed(3))) },
        ]
  return [
    ...common,
    ...metric,
    { header: 'Pressure rating', value: (r) => Number(r.rating.toFixed(2)) },
    { header: 'Pressure balls (sample)', value: (r) => r.pressureBalls },
    { header: 'Reliability %', value: (r) => Number(r.reliability.toFixed(1)) },
    { header: 'Confidence', value: (r) => r.confidence },
  ]
}

function LeaderboardBody({ type, data }) {
  const { filters } = useFilters()
  const { openProfile } = useProfile()
  const notify = useToast()
  const columns = useMemo(() => buildColumns(type), [type])

  function open(row) {
    openProfile(type, row.id)
  }

  function exportCsv() {
    const count = downloadCsv(
      'superr-top10-' + (type === 'batting' ? 'batters' : 'bowlers') + '.csv',
      csvColumns(type),
      data.rows,
      exportPreamble(
        data.meta,
        filters,
        'Top 10 by demo pressure rating. Minimum pressure balls: ' + data.minPressureBalls + '. Confidence filter: ' + data.confidence,
      ),
    )
    notify('Exported top ' + count + ' ' + (type === 'batting' ? 'batters' : 'bowlers') + ' to CSV.', 'success')
  }

  if (data.rows.length === 0) {
    return (
      <EmptyState
        title="No player qualifies"
        message={
          data.eligibleCount === 0
            ? 'Nobody meets the minimum pressure-ball sample with these settings. Lower the minimum or clear the confidence filter.'
            : 'No rows to rank.'
        }
      />
    )
  }

  const podium = []
  const order = [2, 1, 3]
  for (let i = 0; i < order.length; i++) {
    for (let j = 0; j < data.rows.length; j++) {
      if (data.rows[j].rank === order[i]) {
        podium.push(data.rows[j])
      }
    }
  }

  return (
    <div>
      <div className="mb-5 grid gap-3 pt-3 md:grid-cols-3 md:items-end">
        {podium.map((row, index) => (
          <PodiumCard key={row.id} row={row} type={type} onOpen={open} index={index} />
        ))}
      </div>
      <DataTable
        columns={columns}
        rows={data.rows}
        rowKey={(r) => r.id}
        onRowClick={open}
        rowLabel={(r) => 'Open profile for ' + r.name}
        initialSort={{ key: 'rank', direction: 'asc' }}
        caption={type === 'batting' ? 'Top 10 batters' : 'Top 10 bowlers'}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {data.eligibleCount} of {data.totalCount} players meet the minimum sample of {data.minPressureBalls} pressure balls.
        </span>
        <button type="button" className="btn btn-sm" onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export CSV
        </button>
      </div>
    </div>
  )
}

export default function Leaderboard({ type, title, sectionId }) {
  const { filters, filtersKey } = useFilters()
  const [minBalls, setMinBalls] = useState(MIN_PRESSURE_BALLS[type])
  const [confidence, setConfidence] = useState('All')
  const debouncedMin = useDebouncedValue(minBalls, 250)

  const query = useApi(
    function load() {
      return getLeaderboard(type, filters, { minPressureBalls: debouncedMin, confidence: confidence })
    },
    [type, filtersKey, debouncedMin, confidence],
  )

  return (
    <section id={sectionId} aria-labelledby={sectionId + '-title'} className="card card-pad scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={sectionId + '-title'} className="font-display text-lg font-semibold">
              {title}
            </h2>
            {query.data && query.data.meta.isDemo ? <Badge tone="warn">Demo ranking · not verified</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted">Top 10 by pressure rating among players with a sufficient pressure sample.</p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-52">
            <SliderField
              label="Min pressure balls"
              value={minBalls}
              onChange={setMinBalls}
              min={0}
              max={type === 'batting' ? 200 : 300}
              step={5}
            />
          </div>
          <SelectField label="Confidence" className="w-36" value={confidence} options={CONFIDENCE_OPTIONS} onChange={setConfidence} />
        </div>
      </div>
      <AsyncView query={query} skeleton={<TableSkeleton rows={6} />}>
        {function render(data) {
          return <LeaderboardBody type={type} data={data} />
        }}
      </AsyncView>
    </section>
  )
}
