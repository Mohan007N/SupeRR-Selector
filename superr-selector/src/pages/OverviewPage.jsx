import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowUpRight, CalendarDays, Gauge, Lightbulb, Trophy, Users } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import FilterBar from '../components/layout/FilterBar.jsx'
import AsyncView from '../components/ui/AsyncView.jsx'
import { KpiSkeletonRow, ChartSkeleton } from '../components/ui/Skeleton.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Tabs, TabPanel } from '../components/ui/Tabs.jsx'
import Badge, { ConfidenceBadge, RatingPill } from '../components/ui/Badge.jsx'
import KpiCard from '../components/cards/KpiCard.jsx'
import ChartContainer from '../components/charts/ChartContainer.jsx'
import PressureNormalChart from '../components/charts/PressureNormalChart.jsx'
import SeasonTrendChart from '../components/charts/SeasonTrendChart.jsx'
import CompetitionDonut from '../components/charts/CompetitionDonut.jsx'
import { getOverview } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { useFilters } from '../context/FilterContext.jsx'
import { useProfile } from '../context/ProfileContext.jsx'
import { formatNumber } from '../utils/format.js'

const INSIGHT_STYLE = {
  positive: { icon: ArrowUpRight, color: 'text-good', ring: 'bg-good/10' },
  neutral: { icon: Lightbulb, color: 'text-info', ring: 'bg-info/10' },
  caution: { icon: AlertTriangle, color: 'text-warn', ring: 'bg-warn/10' },
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading overview">
      <KpiSkeletonRow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  )
}

function TopPerformers({ data }) {
  const { openProfile } = useProfile()
  const [tab, setTab] = useState('batters')
  const rows = tab === 'batters' ? data.topPerformers.batters : data.topPerformers.bowlers
  const type = tab === 'batters' ? 'batting' : 'bowling'

  return (
    <section className="card card-pad" aria-label="Top pressure performers">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[15px] font-semibold">Top pressure performers</h3>
          <p className="mt-0.5 text-xs text-muted">Ranked by demo pressure rating. Click a player for the full profile.</p>
        </div>
        <Tabs
          idPrefix="top"
          label="Top performers"
          size="sm"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'batters', label: 'Batters' },
            { id: 'bowlers', label: 'Bowlers' },
          ]}
        />
      </div>
      <TabPanel idPrefix="top" id={tab} value={tab}>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted">No player meets the minimum sample in this selection.</p>
        ) : (
          <ol className="divide-y divide-line">
            {rows.map(function renderRow(row, index) {
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={function open() {
                      openProfile(type, row.id)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-panel-2"
                  >
                    <span className="num w-5 text-center font-display text-sm text-muted">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-fg">{row.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {row.teams.join(', ')} · {row.competitions.join(', ')} · {formatNumber(row.pressureBalls)} pressure balls
                      </span>
                    </span>
                    <ConfidenceBadge level={row.confidence} type={type} pressureBalls={row.pressureBalls} />
                    <RatingPill value={row.rating} />
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </TabPanel>
    </section>
  )
}

function Insights({ insights }) {
  const { openProfile } = useProfile()
  return (
    <section className="card card-pad" aria-label="Recent analytical insights">
      <h3 className="font-display text-[15px] font-semibold">Analytical insights</h3>
      <p className="mt-0.5 text-xs text-muted">Generated from the current filter selection.</p>
      <ul className="mt-4 space-y-3">
        {insights.map(function renderInsight(item) {
          const style = INSIGHT_STYLE[item.tone] || INSIGHT_STYLE.neutral
          const Icon = style.icon
          return (
            <li key={item.id} className="flex gap-3 rounded-xl border border-line bg-bg-raised p-3">
              <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' + style.ring + ' ' + style.color}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-fg">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.body}</p>
                {item.playerRef ? (
                  <button
                    type="button"
                    className="mt-1.5 text-xs font-medium text-accent hover:underline"
                    onClick={function open() {
                      openProfile(item.playerRef.type, item.playerRef.id)
                    }}
                  >
                    View profile
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function OverviewBody({ data }) {
  const [trendTab, setTrendTab] = useState('batting')
  const [pvnTab, setPvnTab] = useState('batting')
  const [donutTab, setDonutTab] = useState('matches')

  const kpis = data.kpis
  if (kpis.matches === 0) {
    return (
      <EmptyState
        title="No matches in this selection"
        message="Try a wider date range, another season or the All competitions filter."
      />
    )
  }

  const pvnRows = pvnTab === 'batting' ? data.pressureVsNormal.batting : data.pressureVsNormal.bowling
  const pvnData = []
  for (let i = 0; i < pvnRows.length; i++) {
    pvnData.push({ name: pvnRows[i].group, pressure: pvnRows[i].pressure, normal: pvnRows[i].normal })
  }

  const trendData = []
  for (let i = 0; i < data.seasonTrend.length; i++) {
    const s = data.seasonTrend[i]
    trendData.push({
      season: s.season,
      pressure: trendTab === 'batting' ? s.battingPressure : s.bowlingPressure,
      normal: trendTab === 'batting' ? s.battingNormal : s.bowlingNormal,
    })
  }

  const donutData = []
  for (let i = 0; i < data.competitionDistribution.length; i++) {
    const c = data.competitionDistribution[i]
    const value = donutTab === 'matches' ? c.matches : donutTab === 'players' ? c.players : c.pressureDeliveries
    donutData.push({ name: c.name, value: value })
  }
  const donutLabel = donutTab === 'matches' ? 'matches' : donutTab === 'players' ? 'players' : 'pressure balls'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Matches analysed" value={formatNumber(kpis.matches)} icon={CalendarDays} caption="Demo matches inside the filters" />
        <KpiCard index={1} label="Players analysed" value={formatNumber(kpis.players)} icon={Users} caption={kpis.batters + ' batters · ' + kpis.bowlers + ' bowlers'} />
        <KpiCard
          index={2}
          label="Pressure deliveries"
          value={formatNumber(kpis.pressureDeliveries)}
          icon={Gauge}
          caption={formatNumber(kpis.pressureDeliveriesBowled) + ' bowled'}
          hint="Deliveries that meet the configurable pressure definition. A research choice, not an official rule."
        />
        <KpiCard index={3} label="Competitions" value={String(kpis.competitions.length)} icon={Trophy} caption={kpis.competitions.join(' · ')} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Pressure vs normal performance"
          subtitle={pvnTab === 'batting' ? 'Pooled strike rate (runs per 100 balls)' : 'Pooled economy (runs per over, lower is better)'}
          actions={
            <Tabs
              idPrefix="pvn"
              label="Discipline"
              size="sm"
              value={pvnTab}
              onChange={setPvnTab}
              tabs={[
                { id: 'batting', label: 'Batting' },
                { id: 'bowling', label: 'Bowling' },
              ]}
            />
          }
        >
          <PressureNormalChart data={pvnData} digits={pvnTab === 'batting' ? 1 : 2} unitLabel={pvnTab === 'batting' ? 'SR' : 'Econ'} />
        </ChartContainer>

        <ChartContainer
          title="Season trend"
          subtitle={trendTab === 'batting' ? 'Pooled strike rate by season' : 'Pooled economy by season'}
          footer="The trend ignores the season filter so it always has context."
          actions={
            <Tabs
              idPrefix="trend"
              label="Discipline"
              size="sm"
              value={trendTab}
              onChange={setTrendTab}
              tabs={[
                { id: 'batting', label: 'Batting' },
                { id: 'bowling', label: 'Bowling' },
              ]}
            />
          }
        >
          <SeasonTrendChart data={trendData} digits={trendTab === 'batting' ? 1 : 2} />
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartContainer
          title="Competition distribution"
          height={240}
          actions={
            <Tabs
              idPrefix="dist"
              label="Distribution measure"
              size="sm"
              value={donutTab}
              onChange={setDonutTab}
              tabs={[
                { id: 'matches', label: 'Matches' },
                { id: 'players', label: 'Players' },
                { id: 'balls', label: 'Balls' },
              ]}
            />
          }
        >
          <CompetitionDonut data={donutData} centerLabel={donutLabel} valueLabel={'Share of ' + donutLabel} />
        </ChartContainer>
        <div className="lg:col-span-2">
          <TopPerformers data={data} />
        </div>
      </div>

      <Insights insights={data.insights} />
    </div>
  )
}

export default function OverviewPage() {
  const { filters, filtersKey } = useFilters()
  const query = useApi(
    function load() {
      return getOverview(filters)
    },
    [filtersKey],
  )

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Who holds up under pressure?"
        description="Pressure versus normal-play performance across IPL and T20I, built from ball-by-ball records. Figures shown are demo data until the backend is connected."
        actions={query.data && query.data.meta.isDemo ? <Badge tone="warn">Demo data</Badge> : null}
      />
      <FilterBar />
      <AsyncView query={query} skeleton={<OverviewSkeleton />}>
        {function render(data) {
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <OverviewBody data={data} />
            </motion.div>
          )
        }}
      </AsyncView>
    </>
  )
}
