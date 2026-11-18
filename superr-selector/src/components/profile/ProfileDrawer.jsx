import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Download, GitCompareArrows, X } from 'lucide-react'
import { getPlayerProfile } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { useEscapeKey } from '../../hooks/useEscapeKey.js'
import { useFilters } from '../../context/FilterContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Badge, { ConfidenceBadge, DemoTag } from '../ui/Badge.jsx'
import { Skeleton } from '../ui/Skeleton.jsx'
import { EmptyState, ErrorState } from '../ui/States.jsx'
import { Tabs, TabPanel } from '../ui/Tabs.jsx'
import StatTile from '../cards/StatTile.jsx'
import MetricPairBars from '../charts/MetricPairBars.jsx'
import ConsistencyChart from '../charts/ConsistencyChart.jsx'
import SeasonTrendChart from '../charts/SeasonTrendChart.jsx'
import DataTable from '../tables/DataTable.jsx'
import { downloadCsv } from '../../utils/csv.js'
import { formatDate, formatNumber, formatPercent, formatSigned, initials } from '../../utils/format.js'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pressure', label: 'Pressure vs normal' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'matches', label: 'Match log' },
]

function battingTiles(m) {
  return [
    { label: 'Pressure rating', value: formatNumber(m.rating, 1), sub: '50 = league average', tone: 'accent' },
    { label: 'Runs', value: formatNumber(m.runs), sub: formatNumber(m.balls) + ' balls' },
    { label: 'Strike rate', value: formatNumber(m.strikeRate, 1) },
    { label: 'Average', value: formatNumber(m.average, 1), sub: m.dismissals + ' dismissals' },
    { label: 'Boundary %', value: formatPercent(m.boundaryPct, 1) },
    { label: 'Dismissal rate', value: formatNumber(m.dismissalRate, 2), sub: 'per 100 balls' },
    { label: 'Pressure SR', value: formatNumber(m.pressureStrikeRate, 1) },
    { label: 'Normal SR', value: formatNumber(m.normalStrikeRate, 1) },
    {
      label: 'Improvement',
      value: formatSigned(m.pressureImprovement, 1),
      sub: 'SR points',
      tone: m.pressureImprovement === null ? undefined : m.pressureImprovement >= 0 ? 'good' : 'bad',
    },
  ]
}

function bowlingTiles(m) {
  return [
    { label: 'Pressure rating', value: formatNumber(m.rating, 1), sub: '50 = league average', tone: 'accent' },
    { label: 'Wickets', value: formatNumber(m.wickets), sub: formatNumber(m.legalBalls) + ' legal balls' },
    { label: 'Economy', value: formatNumber(m.economy, 2) },
    { label: 'Wicket rate', value: formatNumber(m.wicketRate, 2), sub: 'per 24 balls' },
    { label: 'Dot-ball %', value: formatPercent(m.dotPct, 1) },
    { label: 'Boundary % conceded', value: formatPercent(m.boundaryPctConceded, 1) },
    { label: 'Pressure economy', value: formatNumber(m.pressureEconomy, 2) },
    { label: 'Normal economy', value: formatNumber(m.normalEconomy, 2) },
    {
      label: 'Improvement',
      value: formatSigned(m.improvement, 2),
      sub: 'runs per over saved',
      tone: m.improvement === null ? undefined : m.improvement >= 0 ? 'good' : 'bad',
    },
  ]
}

function matchLogColumns(type) {
  const base = [
    { key: 'date', header: 'Date', accessor: function a(r) { return r.date }, render: function r(row) { return formatDate(row.date) } },
    { key: 'competition', header: 'Comp', accessor: function a(r) { return r.competition } },
    { key: 'opposition', header: 'Vs', accessor: function a(r) { return r.opposition } },
    { key: 'innings', header: 'Inn', align: 'right', accessor: function a(r) { return r.innings } },
  ]
  if (type === 'batting') {
    return base.concat([
      { key: 'runs', header: 'Runs', align: 'right', accessor: function a(r) { return r.runs }, render: function r(row) { return row.runs + (row.dismissed ? '' : '*') } },
      { key: 'balls', header: 'Balls', align: 'right', accessor: function a(r) { return r.balls } },
      { key: 'strikeRate', header: 'SR', align: 'right', accessor: function a(r) { return r.strikeRate }, render: function r(row) { return formatNumber(row.strikeRate, 1) } },
      { key: 'pressureBalls', header: 'Pressure balls', align: 'right', accessor: function a(r) { return r.pressureBalls } },
    ])
  }
  return base.concat([
    { key: 'wickets', header: 'Wkts', align: 'right', accessor: function a(r) { return r.wickets } },
    { key: 'runs', header: 'Runs', align: 'right', accessor: function a(r) { return r.runs } },
    { key: 'balls', header: 'Balls', align: 'right', accessor: function a(r) { return r.balls } },
    { key: 'economy', header: 'Econ', align: 'right', accessor: function a(r) { return r.economy }, render: function r(row) { return formatNumber(row.economy, 2) } },
    { key: 'pressureBalls', header: 'Pressure balls', align: 'right', accessor: function a(r) { return r.pressureBalls } },
  ])
}

function ProfileBody({ profile, type }) {
  const [tab, setTab] = useState('overview')
  const notify = useToast()

  const m = profile.metrics
  const tiles = type === 'batting' ? battingTiles(m) : bowlingTiles(m)
  const lowSample = m.confidence === 'Low'

  function exportMatchLog() {
    const columns = []
    const defs = matchLogColumns(type)
    for (let i = 0; i < defs.length; i++) {
      const def = defs[i]
      columns.push({
        header: def.header,
        value: function value(row) {
          return def.accessor(row)
        },
      })
    }
    const count = downloadCsv('superr-' + type + '-' + profile.player.id + '-match-log.csv', columns, profile.matchLog, [
      'SupeRR Selector Season 2 - DEMO DATA (synthetic, not verified results)',
      'Player: ' + profile.player.name,
    ])
    notify('Exported ' + count + ' matches for ' + profile.player.name + '.')
  }

  return (
    <div className="space-y-5">
      {lowSample ? (
        <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn" role="note">
          Small pressure sample ({formatNumber(m.pressureBalls)} balls). Pressure figures for this player are indicative only.
        </p>
      ) : null}

      <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="profile" label="Profile sections" size="sm" />

      <TabPanel idPrefix="profile" id="overview" value={tab}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map(function renderTile(tile) {
            return <StatTile key={tile.label} label={tile.label} value={tile.value} sub={tile.sub} tone={tile.tone} />
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatTile label="Matches" value={formatNumber(m.matches)} />
          <StatTile
            label="Pressure sample"
            value={formatNumber(m.pressureBalls) + ' balls'}
            sub={'Reliability ' + formatNumber(m.reliability, 0) + '%'}
          />
        </div>
      </TabPanel>

      <TabPanel idPrefix="profile" id="pressure" value={tab}>
        <MetricPairBars metrics={profile.pressureVsNormal} />
        <h4 className="mb-2 mt-7 font-display text-[13px] font-semibold text-fg">
          {type === 'batting' ? 'Strike rate by season' : 'Economy by season'}
        </h4>
        <div className="h-52">
          <SeasonTrendChart data={profile.bySeason} digits={type === 'batting' ? 1 : 2} />
        </div>
      </TabPanel>

      <TabPanel idPrefix="profile" id="consistency" value={tab}>
        <div className="h-64">
          <ConsistencyChart matchLog={profile.matchLog} type={type} />
        </div>
        {profile.consistency ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile
              label={type === 'batting' ? 'Mean runs / match' : 'Mean economy'}
              value={formatNumber(profile.consistency.mean, type === 'batting' ? 1 : 2)}
              sub={'Std dev ' + formatNumber(profile.consistency.standardDeviation, 1)}
            />
            <StatTile
              label="Variability (CV)"
              value={formatNumber(profile.consistency.coefficientOfVariation, 2)}
              sub="Lower = steadier"
            />
            <div className="col-span-2">
              <StatTile
                label={profile.consistency.thresholdLabel}
                value={formatPercent(profile.consistency.thresholdPct, 0)}
                sub={'of ' + profile.consistency.sample + ' matches'}
              />
            </div>
          </div>
        ) : null}
      </TabPanel>

      <TabPanel idPrefix="profile" id="matches" value={tab}>
        <div className="mb-3 flex justify-end">
          <button type="button" className="btn btn-sm" onClick={exportMatchLog}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export match log
          </button>
        </div>
        <DataTable
          columns={matchLogColumns(type)}
          rows={profile.matchLog}
          rowKey={function key(row) {
            return row.matchId
          }}
          initialSort={{ key: 'date', direction: 'desc' }}
          pageSize={10}
          caption={profile.player.name + ' match log'}
        />
        {type === 'batting' ? <p className="mt-2 text-xs text-faint">* not out</p> : null}
      </TabPanel>
    </div>
  )
}

export default function ProfileDrawer({ target, onClose }) {
  const { filters } = useFilters()
  const navigate = useNavigate()
  const closeRef = useRef(null)
  const panelRef = useRef(null)
  const open = target !== null

  useEscapeKey(open, onClose)

  const query = useApi(
    function load() {
      if (!target) {
        return Promise.resolve(null)
      }
      return getPlayerProfile(target.type, target.id, filters)
    },
    [target ? target.type : null, target ? target.id : null, filters.competition, filters.season, filters.dateFrom, filters.dateTo],
  )

  // Move focus into the drawer on open, lock page scroll, and restore focus on close.
  useEffect(
    function manageFocus() {
      if (!open) {
        return undefined
      }
      const previous = document.activeElement
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      if (closeRef.current) {
        closeRef.current.focus()
      }
      return function restore() {
        document.body.style.overflow = previousOverflow
        if (previous && previous.focus) {
          previous.focus()
        }
      }
    },
    [open],
  )

  // Keep Tab inside the drawer.
  function trapFocus(event) {
    if (event.key !== 'Tab' || !panelRef.current) {
      return
    }
    const focusable = panelRef.current.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) {
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const profile = query.data && target && query.data.player && query.data.player.id === target.id ? query.data : null
  const type = target ? target.type : 'batting'

  function compare() {
    if (!profile) {
      return
    }
    onClose()
    navigate('/comparison?type=' + type + '&a=' + profile.player.id)
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Player profile"
            onKeyDown={trapFocus}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col border-l border-line-strong bg-panel shadow-2xl shadow-black/50"
          >
            <div className="flex items-start gap-4 border-b border-line p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent-line bg-accent-soft font-display text-base font-semibold text-accent">
                {profile ? initials(profile.player.name) : '··'}
              </div>
              <div className="min-w-0 flex-1">
                {profile ? (
                  <>
                    <h2 className="truncate font-display text-lg font-semibold text-fg">{profile.player.name}</h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone="accent">{type === 'batting' ? 'Batter' : 'Bowler'}</Badge>
                      {profile.player.competitions.map(function renderComp(c) {
                        return <Badge key={c}>{c}</Badge>
                      })}
                      <Badge>{profile.player.teams.join(' / ')}</Badge>
                      {profile.hasData ? <ConfidenceBadge level={profile.metrics.confidence} type={type} pressureBalls={profile.metrics.pressureBalls} /> : null}
                      {profile.meta.isDemo ? <DemoTag /> : null}
                    </div>
                  </>
                ) : (
                  <>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-2 h-4 w-64" />
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {profile && profile.hasData ? (
                  <button type="button" className="btn btn-sm" onClick={compare}>
                    <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Compare</span>
                  </button>
                ) : null}
                <button ref={closeRef} type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close profile">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {query.error ? (
                <ErrorState error={query.error} onRetry={query.reload} />
              ) : !profile ? (
                <div className="space-y-4" role="status" aria-label="Loading player profile">
                  <Skeleton className="h-9 w-full" />
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2, 3, 4, 5].map(function renderSkeleton(i) {
                      return <Skeleton key={i} className="h-20" />
                    })}
                  </div>
                  <Skeleton className="h-52 w-full" />
                </div>
              ) : !profile.hasData ? (
                <EmptyState
                  title="No data for this selection"
                  message="This player has no recorded matches inside the current competition, season and date filters. Widen the filters to see their profile."
                />
              ) : (
                <ProfileBody key={profile.player.id + type} profile={profile} type={type} />
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
