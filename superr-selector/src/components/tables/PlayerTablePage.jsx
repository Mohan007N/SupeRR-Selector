import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitCompareArrows, Table2, ScatterChart as ScatterIcon, BarChart3 } from 'lucide-react'
import PageHeader from '../ui/PageHeader.jsx'
import FilterBar from '../layout/FilterBar.jsx'
import AsyncView from '../ui/AsyncView.jsx'
import { TableSkeleton } from '../ui/Skeleton.jsx'
import { EmptyState } from '../ui/States.jsx'
import { Tabs, TabPanel } from '../ui/Tabs.jsx'
import { SelectField } from '../ui/Controls.jsx'
import Badge from '../ui/Badge.jsx'
import StatTile from '../cards/StatTile.jsx'
import ChartContainer from '../charts/ChartContainer.jsx'
import PressureScatter from '../charts/PressureScatter.jsx'
import PressureNormalChart from '../charts/PressureNormalChart.jsx'
import DataTable from './DataTable.jsx'
import TableToolbar from './TableToolbar.jsx'
import { battingColumns, bowlingColumns, battingCsvColumns, bowlingCsvColumns, exportPreamble } from './playerColumns.jsx'
import { getPlayerTable } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { useFilters } from '../../context/FilterContext.jsx'
import { useProfile } from '../../context/ProfileContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { downloadCsv } from '../../utils/csv.js'
import { formatNumber, slugify } from '../../utils/format.js'

const VIEW_TABS = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'scatter', label: 'Pressure vs normal', icon: ScatterIcon },
  { id: 'top', label: 'Top 8 comparison', icon: BarChart3 },
]

const CONFIDENCE_OPTIONS = [
  { value: 'All', label: 'All confidence' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
]

function filterRows(rows, query, team, confidence) {
  const text = query.trim().toLowerCase()
  const result = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (team !== 'All' && row.teams.indexOf(team) === -1) continue
    if (confidence !== 'All' && row.confidence !== confidence) continue
    if (text.length > 0) {
      const haystack = (row.name + ' ' + row.teams.join(' ') + ' ' + row.competitions.join(' ')).toLowerCase()
      if (haystack.indexOf(text) === -1) continue
    }
    result.push(row)
  }
  return result
}

function PlayerTableBody({ type, data }) {
  const { filters } = useFilters()
  const { openProfile } = useProfile()
  const notify = useToast()
  const navigate = useNavigate()
  const isBatting = type === 'batting'

  const [view, setView] = useState('table')
  const [query, setQuery] = useState('')
  const [team, setTeam] = useState('All')
  const [confidence, setConfidence] = useState('All')
  const debouncedQuery = useDebouncedValue(query, 150)

  const columns = useMemo(() => (isBatting ? battingColumns() : bowlingColumns()), [isBatting])

  const teamOptions = useMemo(
    function buildTeams() {
      const seen = {}
      const list = [{ value: 'All', label: 'All teams' }]
      for (let i = 0; i < data.rows.length; i++) {
        for (let j = 0; j < data.rows[i].teams.length; j++) {
          const t = data.rows[i].teams[j]
          if (!seen[t]) {
            seen[t] = true
            list.push({ value: t, label: t })
          }
        }
      }
      list.sort(function byLabel(a, b) {
        if (a.value === 'All') return -1
        if (b.value === 'All') return 1
        return a.label.localeCompare(b.label)
      })
      return list
    },
    [data.rows],
  )
  // A team may vanish when filters change. Fall back to All.
  const activeTeam = teamOptions.some((o) => o.value === team) ? team : 'All'

  const rows = useMemo(
    () => filterRows(data.rows, debouncedQuery, activeTeam, confidence),
    [data.rows, debouncedQuery, activeTeam, confidence],
  )

  const scatterRows = useMemo(
    function buildScatter() {
      const list = []
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        const x = isBatting ? r.normalStrikeRate : r.normalEconomy
        const y = isBatting ? r.pressureStrikeRate : r.pressureEconomy
        if (x !== null && y !== null) {
          list.push({ id: r.id, name: r.name, x: x, y: y })
        }
      }
      return list
    },
    [rows, isBatting],
  )

  const topData = useMemo(
    function buildTop() {
      const rated = rows.filter((r) => r.rating !== null)
      rated.sort((a, b) => b.rating - a.rating)
      const list = []
      for (let i = 0; i < rated.length && i < 8; i++) {
        list.push({
          name: rated[i].name,
          pressure: isBatting ? rated[i].pressureStrikeRate : rated[i].pressureEconomy,
          normal: isBatting ? rated[i].normalStrikeRate : rated[i].normalEconomy,
        })
      }
      return list
    },
    [rows, isBatting],
  )

  function handleExport() {
    const csvColumns = isBatting ? battingCsvColumns() : bowlingCsvColumns()
    const count = downloadCsv(
      'superr-' + type + '-' + slugify(filters.competition + '-' + filters.season) + '.csv',
      csvColumns,
      rows,
      exportPreamble(data.meta, filters, 'Rows: ' + rows.length + ' (table search and filters applied)'),
    )
    notify('Exported ' + count + ' ' + (isBatting ? 'batters' : 'bowlers') + ' to CSV.', 'success')
  }

  function resetLocal() {
    setQuery('')
    setTeam('All')
    setConfidence('All')
  }

  function openRow(row) {
    openProfile(type, row.id)
  }

  const baseline = data.baseline
  const tiles = isBatting
    ? [
        { label: 'Players in table', value: formatNumber(data.rows.length), sub: formatNumber(data.matchesInScope) + ' matches in scope' },
        { label: 'League pressure SR', value: formatNumber(baseline.pressureStrikeRate, 1), sub: 'pooled', tone: 'accent' },
        { label: 'League normal SR', value: formatNumber(baseline.normalStrikeRate, 1), sub: 'pooled' },
        { label: 'Pressure balls', value: formatNumber(baseline.pressureBalls), sub: 'across all batters' },
      ]
    : [
        { label: 'Players in table', value: formatNumber(data.rows.length), sub: formatNumber(data.matchesInScope) + ' matches in scope' },
        { label: 'League pressure economy', value: formatNumber(baseline.pressureEconomy, 2), sub: 'pooled', tone: 'accent' },
        { label: 'League normal economy', value: formatNumber(baseline.normalEconomy, 2), sub: 'pooled' },
        { label: 'Pressure balls', value: formatNumber(baseline.pressureBalls), sub: 'across all bowlers' },
      ]

  if (data.rows.length === 0) {
    return <EmptyState title="No players in this selection" message="No player has a record inside the current filters. Widen the date range or choose another season." />
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <StatTile key={t.label} label={t.label} value={t.value} sub={t.sub} tone={t.tone} />
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs idPrefix={type + '-view'} label="View" tabs={VIEW_TABS} value={view} onChange={setView} />
        <div className="flex flex-wrap items-end gap-3">
          <SelectField label="Team" className="w-40" value={activeTeam} options={teamOptions} onChange={setTeam} />
          <SelectField label="Confidence" className="w-40" value={confidence} options={CONFIDENCE_OPTIONS} onChange={setConfidence} />
          <button type="button" className="btn" onClick={() => navigate('/comparison?type=' + type)}>
            <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            Compare
          </button>
        </div>
      </div>

      <TabPanel idPrefix={type + '-view'} id="table" value={view}>
        <TableToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder={'Search ' + (isBatting ? 'batters' : 'bowlers') + ', teams'}
          count={rows.length}
          total={data.rows.length}
          onExport={handleExport}
          exportDisabled={rows.length === 0}
        />
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={openRow}
          rowLabel={(row) => 'Open profile for ' + row.name}
          initialSort={{ key: 'rating', direction: 'desc' }}
          caption={isBatting ? 'Batter analytics' : 'Bowler analytics'}
          pageSize={12}
          emptyMessage="No players match your search and filters."
        />
        {rows.length === 0 ? (
          <div className="mt-3 text-center">
            <button type="button" className="btn btn-sm" onClick={resetLocal}>
              Clear search and table filters
            </button>
          </div>
        ) : null}
      </TabPanel>

      <TabPanel idPrefix={type + '-view'} id="scatter" value={view}>
        <ChartContainer
          title={isBatting ? 'Strike rate: pressure vs normal' : 'Economy: pressure vs normal'}
          subtitle={
            isBatting
              ? 'Above the dashed line = scores faster under pressure. Click a dot to open the profile.'
              : 'Below the dashed line = more economical under pressure. Click a dot to open the profile.'
          }
          height={420}
          footer={scatterRows.length + ' players plotted. Small pressure samples can sit far from the line by chance.'}
        >
          {scatterRows.length === 0 ? (
            <p className="flex h-full items-center justify-center text-[13px] text-muted">No players have both pressure and normal data.</p>
          ) : (
            <PressureScatter
              rows={scatterRows}
              digits={isBatting ? 1 : 2}
              betterWhenLower={!isBatting}
              axisLabelX={isBatting ? 'Normal strike rate' : 'Normal economy'}
              axisLabelY={isBatting ? 'Pressure strike rate' : 'Pressure economy'}
              onSelect={(point) => openProfile(type, point.id)}
            />
          )}
        </ChartContainer>
      </TabPanel>

      <TabPanel idPrefix={type + '-view'} id="top" value={view}>
        <ChartContainer
          title={isBatting ? 'Top 8 batters by rating' : 'Top 8 bowlers by rating'}
          subtitle={isBatting ? 'Pressure vs normal strike rate' : 'Pressure vs normal economy'}
          height={380}
          actions={<Badge tone="neutral">Respects search and filters</Badge>}
        >
          {topData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-[13px] text-muted">No rated players in this selection.</p>
          ) : (
            <PressureNormalChart data={topData} horizontal digits={isBatting ? 1 : 2} />
          )}
        </ChartContainer>
      </TabPanel>
    </div>
  )
}

export default function PlayerTablePage({ type }) {
  const { filters, filtersKey } = useFilters()
  const isBatting = type === 'batting'
  const query = useApi(
    function load() {
      return getPlayerTable(type, filters)
    },
    [type, filtersKey],
  )

  return (
    <>
      <PageHeader
        eyebrow={isBatting ? 'Batting analytics' : 'Bowling analytics'}
        title={isBatting ? 'Batters under pressure' : 'Bowlers under pressure'}
        description={
          isBatting
            ? 'Search, sort and open any batter. Pressure strike rate is compared against the same player in normal play.'
            : 'Economy, wicket rate and dot-ball control under pressure versus normal play. Lower economy is better.'
        }
        actions={query.data && query.data.meta.isDemo ? <Badge tone="warn">Demo data</Badge> : null}
      />
      <FilterBar />
      <AsyncView query={query} skeleton={<TableSkeleton rows={10} />}>
        {function render(data) {
          return <PlayerTableBody key={type} type={type} data={data} />
        }}
      </AsyncView>
    </>
  )
}
