import { useMemo, useState } from 'react'
import { BarChart3, Info, RotateCcw, Scale, Timer, TrendingUp, Users } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import FilterBar from '../components/layout/FilterBar.jsx'
import AsyncView from '../components/ui/AsyncView.jsx'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Tabs, TabPanel } from '../components/ui/Tabs.jsx'
import { SliderField } from '../components/ui/Controls.jsx'
import Badge from '../components/ui/Badge.jsx'
import StatTile from '../components/cards/StatTile.jsx'
import ChartContainer from '../components/charts/ChartContainer.jsx'
import { PressureByOverChart, PressureDistributionChart, PressureHeatmap } from '../components/charts/PressureCharts.jsx'
import { getPressureBins } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { useFilters } from '../context/FilterContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { TOTAL_BALLS, analysePressure, pressureIndex, pressureLevel, rateComponent } from '../utils/pressure.js'
import { formatNumber, formatPercent } from '../utils/format.js'

const INNINGS_TABS = [
  { id: 'first', label: 'First innings' },
  { id: 'second', label: 'Second innings (chase)' },
]

const FACTORS = [
  {
    icon: TrendingUp,
    title: 'Run rate',
    first: 'Current run rate. Scoring below par (8.5) adds pressure; 5.0 or less is the maximum.',
    second: 'Required run rate. 6.0 or less adds nothing; 14.0 or more is the maximum.',
  },
  {
    icon: Users,
    title: 'Wickets remaining',
    first: 'Wickets lost out of 10. Fewer wickets in hand means less room for risk.',
    second: 'Wickets lost out of 10. Same scale in both innings, weighted differently.',
  },
  {
    icon: Timer,
    title: 'Balls remaining',
    first: 'Used through innings stage: pressure builds as balls remaining shrink.',
    second: 'Used through innings stage. A chase has no slack at the death.',
  },
  {
    icon: Scale,
    title: 'Innings stage',
    first: 'Stage = 1 − balls remaining / 120. Rises from 0 at the first ball to 1 at the last.',
    second: 'Same definition. Weighted at 25% in the default chase configuration.',
  },
]

const LEVEL_TONE = { Low: 'good', Medium: 'warn', High: 'bad' }

function ConfigPanel({ innings, config, defaults, onChange, onReset }) {
  const weights = config.weights
  const thresholds = config.thresholds
  const total = weights.rate + weights.wickets + weights.stage

  function setWeight(key, value) {
    onChange({ ...config, weights: { ...weights, [key]: value } })
  }
  function setLow(value) {
    const medium = Math.max(thresholds.mediumMax, value + 5)
    onChange({ ...config, thresholds: { lowMax: value, mediumMax: Math.min(95, medium) } })
  }
  function setMedium(value) {
    const low = Math.min(thresholds.lowMax, value - 5)
    onChange({ ...config, thresholds: { lowMax: Math.max(5, low), mediumMax: value } })
  }
  const changed = JSON.stringify(config) !== JSON.stringify(defaults)

  return (
    <section className="card card-pad" aria-label="Pressure configuration">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-display text-[15px] font-semibold">Configuration</h3>
        <button type="button" className="btn btn-sm" onClick={onReset} disabled={!changed}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>
      <p className="mb-4 text-xs text-muted">
        Applies to the {innings === 'first' ? 'first innings' : 'second innings'} only. Weights are relative, so only their ratio matters.
      </p>
      <div className="space-y-4">
        <SliderField label="Run-rate weight" value={weights.rate} onChange={(v) => setWeight('rate', v)} min={0} max={100} step={5} hint={total > 0 ? formatPercent((weights.rate * 100) / total, 0) + ' of the index' : undefined} />
        <SliderField label="Wickets weight" value={weights.wickets} onChange={(v) => setWeight('wickets', v)} min={0} max={100} step={5} hint={total > 0 ? formatPercent((weights.wickets * 100) / total, 0) + ' of the index' : undefined} />
        <SliderField label="Stage weight" value={weights.stage} onChange={(v) => setWeight('stage', v)} min={0} max={100} step={5} hint={total > 0 ? formatPercent((weights.stage * 100) / total, 0) + ' of the index' : undefined} />
        <div className="h-px bg-line" />
        <SliderField label="Low / Medium boundary" value={thresholds.lowMax} onChange={setLow} min={5} max={90} step={1} hint="Index below this is Low pressure" />
        <SliderField label="Medium / High boundary" value={thresholds.mediumMax} onChange={setMedium} min={10} max={95} step={1} hint="Index at or above this is High pressure" />
      </div>
      {total === 0 ? (
        <p className="mt-3 text-xs text-bad" role="alert">All weights are zero, so every delivery scores 0 (Low). Raise at least one weight.</p>
      ) : null}
    </section>
  )
}

function WhatIf({ innings, config }) {
  const [rate, setRate] = useState(innings === 'first' ? 7 : 10)
  const [wickets, setWickets] = useState(4)
  const [balls, setBalls] = useState(36)

  const state = { rate: rate, wicketsLost: wickets, ballsRemaining: balls }
  const index = pressureIndex(innings, state, config)
  const level = pressureLevel(index, config.thresholds)
  const fRate = rateComponent(innings, rate)
  const fWickets = wickets / 10
  const fStage = 1 - balls / TOTAL_BALLS

  return (
    <section className="card card-pad" aria-label="Single delivery pressure calculator">
      <h3 className="font-display text-[15px] font-semibold">Try a match state</h3>
      <p className="mt-0.5 mb-4 text-xs text-muted">Set a situation and see how the current configuration scores it.</p>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <SliderField label={innings === 'first' ? 'Current run rate' : 'Required run rate'} value={rate} onChange={setRate} min={0} max={innings === 'first' ? 14 : 20} step={0.5} />
          <SliderField label="Wickets lost" value={wickets} onChange={setWickets} min={0} max={10} />
          <SliderField label="Balls remaining" value={balls} onChange={setBalls} min={1} max={TOTAL_BALLS} />
        </div>
        <div className="rounded-xl border border-line bg-bg-raised p-4">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Pressure index</p>
            <Badge tone={LEVEL_TONE[level]}>{level}</Badge>
          </div>
          <p className="num mt-1 font-display text-3xl font-semibold text-fg" aria-live="polite">{formatNumber(index, 1)}</p>
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><dt className="text-muted">Run-rate component</dt><dd className="num text-fg-soft">{formatNumber(fRate, 2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Wickets component</dt><dd className="num text-fg-soft">{formatNumber(fWickets, 2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Stage component</dt><dd className="num text-fg-soft">{formatNumber(fStage, 2)}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  )
}

function PressureBody({ data }) {
  const notify = useToast()
  const [innings, setInnings] = useState('first')
  const [configs, setConfigs] = useState({ first: data.defaults.first, second: data.defaults.second })

  const config = configs[innings]
  const defaults = data.defaults[innings]

  const analysis = useMemo(() => analysePressure(data.bins, innings, config), [data.bins, innings, config])
  const otherInnings = innings === 'first' ? 'second' : 'first'
  const otherAnalysis = useMemo(() => analysePressure(data.bins, otherInnings, configs[otherInnings]), [data.bins, otherInnings, configs])

  function updateConfig(next) {
    setConfigs({ ...configs, [innings]: next })
  }
  function resetConfig() {
    setConfigs({ ...configs, [innings]: data.defaults[innings] })
    notify('Thresholds and weights reset to defaults for this innings.', 'info')
  }

  if (data.bins.length === 0) {
    return <EmptyState title="No delivery states for this competition" message="The pressure analysis needs delivery-state data. Choose another competition." />
  }

  const high = analysis.distribution[2]
  const medium = analysis.distribution[1]
  const otherHigh = otherAnalysis.distribution[2]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-info/25 bg-info/[0.06] p-4 text-[13px] text-fg-soft" role="note">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-info">Research choices, not official rules.</strong> The factors, weights and thresholds below are
          configurable assumptions made for this project. No cricket body defines "pressure" this way, and these settings have not been validated.
          Change them and the distributions on this page recalculate.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FACTORS.map(function renderFactor(f) {
          const Icon = f.icon
          return (
            <div key={f.title} className="card card-pad">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <h3 className="mt-3 text-[13px] font-semibold text-fg">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{innings === 'first' ? f.first : f.second}</p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs idPrefix="inn" label="Innings context" tabs={INNINGS_TABS} value={innings} onChange={setInnings} />
        <p className="text-xs text-muted">{formatNumber(analysis.total)} simulated deliveries in this innings context</p>
      </div>

      <TabPanel idPrefix="inn" id={innings} value={innings} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="High pressure share" value={formatPercent(high.share, 1)} tone="bad" sub={formatNumber(high.count) + ' deliveries'} />
          <StatTile label="Medium pressure share" value={formatPercent(medium.share, 1)} tone="accent" sub={formatNumber(medium.count) + ' deliveries'} />
          <StatTile label="Low pressure share" value={formatPercent(analysis.distribution[0].share, 1)} tone="good" sub={formatNumber(analysis.distribution[0].count) + ' deliveries'} />
          <StatTile
            label={'High share, ' + (innings === 'first' ? 'second' : 'first') + ' innings'}
            value={formatPercent(otherHigh.share, 1)}
            sub="with that innings' own settings"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <ConfigPanel innings={innings} config={config} defaults={defaults} onChange={updateConfig} onReset={resetConfig} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:col-span-2">
            <ChartContainer title="Pressure distribution" subtitle="Share of deliveries at each pressure level" height={240}>
              <PressureDistributionChart distribution={analysis.distribution} />
            </ChartContainer>
            <ChartContainer
              title="Mean pressure index by over"
              subtitle="Dashed lines mark the current Low and High thresholds"
              height={240}
            >
              <PressureByOverChart byOver={analysis.byOver} thresholds={config.thresholds} />
            </ChartContainer>
          </div>
        </div>

        <ChartContainer title="Where pressure sits: over × wickets lost" subtitle="Mean pressure index per cell. Cells with fewer than 3 deliveries are left blank." height="auto">
          <PressureHeatmap grid={analysis.grid} />
        </ChartContainer>

        <WhatIf key={innings} innings={innings} config={config} />
      </TabPanel>

      <section className="card card-pad" aria-label="How this page relates to player data">
        <div className="flex items-start gap-3">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
          <div className="text-[13px] leading-relaxed text-fg-soft">
            <p className="font-medium text-fg">What these settings do not change (demo mode)</p>
            <p className="mt-1 text-muted">
              This page applies the index to simulated delivery states. The demo player tables and rankings label the closing phase of each innings
              as "pressure" when the data is generated, so changing the settings here does not re-rate players. In a connected backend the same
              index would be computed per delivery and used to tag pressure balls before any rating is calculated.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function PressurePage() {
  const { filters } = useFilters()
  const query = useApi(
    function load() {
      return getPressureBins(filters)
    },
    [filters.competition],
  )

  return (
    <>
      <PageHeader
        eyebrow="Pressure analysis"
        title="Defining pressure"
        description="How required run rate, wickets, balls remaining and innings stage combine into a pressure index, and how that index splits deliveries into low, medium and high pressure."
        actions={query.data && query.data.meta.isDemo ? <Badge tone="warn">Demo data</Badge> : null}
      />
      <FilterBar controls={['competition']} note="Pressure states depend on the competition only. Season and date filters do not apply to this page." />
      <AsyncView query={query} skeleton={<PageSkeleton />}>
        {function render(data) {
          return <PressureBody data={data} />
        }}
      </AsyncView>
    </>
  )
}
