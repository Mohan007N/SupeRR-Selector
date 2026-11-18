import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Download, Trophy, UserRoundSearch } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import FilterBar from '../components/layout/FilterBar.jsx'
import AsyncView from '../components/ui/AsyncView.jsx'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Segmented, SelectField } from '../components/ui/Controls.jsx'
import Badge from '../components/ui/Badge.jsx'
import ChartContainer from '../components/charts/ChartContainer.jsx'
import { ComparisonBars, ComparisonRadar } from '../components/charts/ComparisonCharts.jsx'
import { exportPreamble } from '../components/tables/playerColumns.jsx'
import { getComparison, getPlayerDirectory } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { useFilters } from '../context/FilterContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { downloadCsv } from '../utils/csv.js'
import { CHART_COLORS } from '../components/charts/chartTheme.js'
import { formatNumber, slugify } from '../utils/format.js'

const TYPE_OPTIONS = [
  { value: 'batting', label: 'Batters' },
  { value: 'bowling', label: 'Bowlers' },
]

function findTableValue(table, key) {
  for (let i = 0; i < table.length; i++) {
    if (table[i].key === key) {
      return table[i]
    }
  }
  return null
}

function barSets(type, table) {
  const defs =
    type === 'batting'
      ? [
          { title: 'Strike rate', subtitle: 'Pressure vs normal (runs per 100 balls)', digits: 1, keys: [['pressureStrikeRate', 'Pressure SR'], ['normalStrikeRate', 'Normal SR']] },
          { title: 'Rating and average', subtitle: 'Pressure rating (50 = league) and batting average', digits: 1, keys: [['rating', 'Rating'], ['average', 'Average']] },
        ]
      : [
          { title: 'Economy', subtitle: 'Pressure vs normal (runs per over, lower is better)', digits: 2, keys: [['pressureEconomy', 'Pressure econ'], ['normalEconomy', 'Normal econ']] },
          { title: 'Rating and wicket rate', subtitle: 'Pressure rating (50 = league) and wickets per 24 balls', digits: 2, keys: [['rating', 'Rating'], ['wicketRate', 'Wkts / 24']] },
        ]
  const sets = []
  for (let i = 0; i < defs.length; i++) {
    const data = []
    for (let j = 0; j < defs[i].keys.length; j++) {
      const row = findTableValue(table, defs[i].keys[j][0])
      if (row) {
        data.push({ name: defs[i].keys[j][1], a: row.a, b: row.b })
      }
    }
    sets.push({ title: defs[i].title, subtitle: defs[i].subtitle, digits: defs[i].digits, data: data })
  }
  return sets
}

function ComparisonTable({ data }) {
  let winsA = 0
  let winsB = 0
  for (let i = 0; i < data.table.length; i++) {
    if (data.table[i].winner === 'a') winsA += 1
    if (data.table[i].winner === 'b') winsB += 1
  }
  return (
    <section className="card card-pad" aria-label="Metric table">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[15px] font-semibold">Metric table</h3>
          <p className="mt-0.5 text-xs text-muted">The better value is highlighted. Count-type rows (matches, runs) are context only.</p>
        </div>
        <p className="num text-xs text-muted">
          <span style={{ color: CHART_COLORS.playerA }}>{data.a.name} {winsA}</span> · <span style={{ color: CHART_COLORS.playerB }}>{data.b.name} {winsB}</span> metric wins
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[420px] text-[13px]">
          <caption className="sr-only">Side by side metrics</caption>
          <thead>
            <tr className="border-b border-line bg-bg-raised text-[11px] uppercase tracking-[0.1em] text-muted">
              <th scope="col" className="px-3 py-2.5 text-left font-medium">Metric</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium" style={{ color: CHART_COLORS.playerA }}>{data.a.name}</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium" style={{ color: CHART_COLORS.playerB }}>{data.b.name}</th>
            </tr>
          </thead>
          <tbody>
            {data.table.map(function renderRow(row) {
              return (
                <tr key={row.key} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-3 py-2.5 text-left font-normal text-fg-soft">{row.label}</th>
                  <td className={'num px-3 py-2.5 text-right ' + (row.winner === 'a' ? 'font-semibold text-accent' : 'text-fg')}>
                    {formatNumber(row.a, row.digits)}
                    {row.winner === 'a' ? <span className="sr-only"> (better)</span> : null}
                  </td>
                  <td className={'num px-3 py-2.5 text-right ' + (row.winner === 'b' ? 'font-semibold text-info' : 'text-fg')}>
                    {formatNumber(row.b, row.digits)}
                    {row.winner === 'b' ? <span className="sr-only"> (better)</span> : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ComparisonResults({ type, data }) {
  const { filters } = useFilters()
  const notify = useToast()

  if (!data.a.hasData || !data.b.hasData) {
    const missing = []
    if (!data.a.hasData) missing.push(data.a.name)
    if (!data.b.hasData) missing.push(data.b.name)
    return (
      <EmptyState
        title="Not enough data to compare"
        message={missing.join(' and ') + ' ' + (missing.length > 1 ? 'have' : 'has') + ' no records inside the current filters. Widen the filters or choose another player.'}
      />
    )
  }

  const sets = barSets(type, data.table)

  function exportCsv() {
    const columns = [
      { header: 'Metric', value: (r) => r.label },
      { header: data.a.name, value: (r) => (r.a === null ? '' : Number(r.a.toFixed(3))) },
      { header: data.b.name, value: (r) => (r.b === null ? '' : Number(r.b.toFixed(3))) },
      { header: 'Better', value: (r) => (r.winner === 'a' ? data.a.name : r.winner === 'b' ? data.b.name : '') },
    ]
    const count = downloadCsv(
      'superr-compare-' + slugify(data.a.name) + '-vs-' + slugify(data.b.name) + '.csv',
      columns,
      data.table,
      exportPreamble(data.meta, filters),
    )
    notify('Exported ' + count + ' comparison rows to CSV.', 'success')
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sets.map(function renderSet(set) {
          return (
            <ChartContainer key={set.title} title={set.title} subtitle={set.subtitle} height={260}>
              <ComparisonBars data={set.data} nameA={data.a.name} nameB={data.b.name} digits={set.digits} />
            </ChartContainer>
          )
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Percentile radar"
            subtitle={'Percentile against ' + data.radarPoolSize + ' players with a usable sample. Larger = better.'}
            height={340}
          >
            <ComparisonRadar data={data.radar} nameA={data.a.name} nameB={data.b.name} />
          </ChartContainer>
        </div>
        <div className="lg:col-span-3">
          <ComparisonTable data={data} />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="button" className="btn" onClick={exportCsv}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Export comparison CSV
        </button>
      </div>
    </div>
  )
}

export default function ComparisonPage() {
  const [params, setParams] = useSearchParams()
  const { filters, filtersKey } = useFilters()
  const type = params.get('type') === 'bowling' ? 'bowling' : 'batting'
  const idA = params.get('a') || ''
  const idB = params.get('b') || ''

  const directory = useApi(function load() {
    return getPlayerDirectory()
  }, [])

  const players = useMemo(
    function filterByType() {
      const list = []
      if (directory.data) {
        for (let i = 0; i < directory.data.players.length; i++) {
          if (directory.data.players[i].type === type) {
            list.push(directory.data.players[i])
          }
        }
      }
      return list
    },
    [directory.data, type],
  )

  // Ignore ids from the URL that do not belong to the chosen player type.
  const validA = players.some((p) => p.id === idA) ? idA : ''
  const validB = players.some((p) => p.id === idB) ? idB : ''
  const ready = validA !== '' && validB !== '' && validA !== validB

  const comparison = useApi(
    function load() {
      if (!ready) {
        return Promise.resolve(null)
      }
      return getComparison(type, validA, validB, filters)
    },
    [ready, type, validA, validB, filtersKey],
  )

  function update(changes) {
    const next = new URLSearchParams(params)
    const keys = Object.keys(changes)
    for (let i = 0; i < keys.length; i++) {
      if (changes[keys[i]]) {
        next.set(keys[i], changes[keys[i]])
      } else {
        next.delete(keys[i])
      }
    }
    setParams(next, { replace: true })
  }

  function optionsFor(excludeId) {
    const options = [{ value: '', label: 'Select a player' }]
    for (let i = 0; i < players.length; i++) {
      options.push({
        value: players[i].id,
        label: players[i].name + ' (' + players[i].teams.join(', ') + ')',
        disabled: players[i].id === excludeId,
      })
    }
    return options
  }

  function loadExample() {
    if (players.length >= 2) {
      update({ a: players[0].id, b: players[1].id })
    }
  }

  function swap() {
    update({ a: validB, b: validA })
  }

  return (
    <>
      <PageHeader
        eyebrow="Player comparison"
        title="Two players, side by side"
        description="Pick two batters or two bowlers. Bars, radar percentiles and the metric table update with the filters."
        actions={comparison.data && comparison.data.meta.isDemo ? <Badge tone="warn">Demo data</Badge> : null}
      />
      <FilterBar controls={['competition', 'season', 'date']} />

      <section className="card card-pad mb-6" aria-label="Choose players">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="eyebrow mb-1.5">Compare</p>
            <Segmented label="Player type" options={TYPE_OPTIONS} value={type} onChange={(value) => update({ type: value, a: '', b: '' })} />
          </div>
          <SelectField label="Player A" className="min-w-[220px] flex-1" value={validA} options={optionsFor(validB)} onChange={(v) => update({ a: v })} />
          <button type="button" className="btn mb-px" onClick={swap} disabled={!validA || !validB} aria-label="Swap players">
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <SelectField label="Player B" className="min-w-[220px] flex-1" value={validB} options={optionsFor(validA)} onChange={(v) => update({ b: v })} />
        </div>
        {directory.error ? (
          <p className="mt-3 text-xs text-bad" role="alert">
            Could not load the player list: {directory.error.message}
          </p>
        ) : null}
      </section>

      {!ready ? (
        <EmptyState
          icon={UserRoundSearch}
          title="Choose two players to compare"
          message="Select Player A and Player B above, or open any profile and press Compare. Two different players are needed."
          action={
            <button type="button" className="btn btn-primary" onClick={loadExample} disabled={players.length < 2}>
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Load an example pair
            </button>
          }
        />
      ) : (
        <AsyncView query={comparison} skeleton={<PageSkeleton />}>
          {function render(data) {
            return <ComparisonResults key={validA + validB + type} type={type} data={data} />
          }}
        </AsyncView>
      )}
    </>
  )
}
