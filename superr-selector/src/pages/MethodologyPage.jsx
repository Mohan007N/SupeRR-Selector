import { useEffect, useState } from 'react'
import { AlertTriangle, CircleDashed } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import AsyncView from '../components/ui/AsyncView.jsx'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import Badge from '../components/ui/Badge.jsx'
import { getMethodology } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { RATE_REFERENCE, TOTAL_BALLS } from '../utils/pressure.js'
import { formatNumber, formatPercent } from '../utils/format.js'

const SECTIONS = [
  { id: 'pressure', title: 'Pressure definition' },
  { id: 'features', title: 'Feature engineering' },
  { id: 'batting', title: 'Batting rating' },
  { id: 'bowling', title: 'Bowling rating' },
  { id: 'baselines', title: 'Normal vs pressure baselines' },
  { id: 'sample', title: 'Sample-size eligibility' },
  { id: 'reliability', title: 'Statistical reliability' },
  { id: 'competitions', title: 'IPL / T20I comparison' },
  { id: 'status', title: 'Validation status' },
  { id: 'limitations', title: 'Limitations' },
]

// Readable maths helpers: italic variables with subscripts.
function V({ children }) {
  return <i className="font-serif">{children}</i>
}
function Sub({ children }) {
  return <sub className="text-[0.75em]">{children}</sub>
}

function Formula({ label, children }) {
  return (
    <figure className="my-4 rounded-xl border border-line bg-bg-raised px-4 py-4">
      {label ? <figcaption className="eyebrow mb-2">{label}</figcaption> : null}
      <div className="overflow-x-auto whitespace-nowrap font-serif text-[16px] leading-8 text-fg">{children}</div>
    </figure>
  )
}

function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={id + '-h'} className="card card-pad scroll-mt-24">
      <h2 id={id + '-h'} className="font-display text-lg font-semibold text-fg">{title}</h2>
      <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-fg-soft">{children}</div>
    </section>
  )
}

function StatusRow({ name, status, note }) {
  const map = {
    implemented: { icon: CircleDashed, tone: 'warn', label: 'Implemented in demo, not validated' },
    planned: { icon: CircleDashed, tone: 'neutral', label: 'Planned' },
  }
  const style = map[status]
  const Icon = style.icon
  return (
    <tr className="border-b border-line last:border-b-0">
      <th scope="row" className="px-3 py-2.5 text-left font-medium text-fg">{name}</th>
      <td className="px-3 py-2.5"><Badge tone={style.tone}><Icon className="h-3 w-3" aria-hidden="true" />{style.label}</Badge></td>
      <td className="px-3 py-2.5 text-muted">{note}</td>
    </tr>
  )
}

function Toc({ active }) {
  return (
    <nav aria-label="On this page" className="card sticky top-24 hidden p-3 xl:block">
      <p className="eyebrow mb-2 px-2">On this page</p>
      <ul className="space-y-0.5">
        {SECTIONS.map(function renderLink(s) {
          return (
            <li key={s.id}>
              <a
                href={'#' + s.id}
                onClick={function go(event) {
                  event.preventDefault()
                  const el = document.getElementById(s.id)
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                aria-current={active === s.id ? 'location' : undefined}
                className={'block rounded-md px-2 py-1.5 text-xs transition-colors ' + (active === s.id ? 'bg-accent-soft text-accent' : 'text-muted hover:text-fg')}
              >
                {s.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function MethodologyBody({ data }) {
  const [active, setActive] = useState('pressure')
  const p = data.parameters
  const rating = p.rating
  const first = p.pressure.first
  const second = p.pressure.second

  // Highlight the section nearest the top while scrolling.
  useEffect(function trackScroll() {
    function onScroll() {
      let current = SECTIONS[0].id
      for (let i = 0; i < SECTIONS.length; i++) {
        const el = document.getElementById(SECTIONS[i].id)
        if (el && el.getBoundingClientRect().top < 140) {
          current = SECTIONS[i].id
        }
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return function stop() {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className="grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)]">
      <Toc active={active} />
      <div className="min-w-0 space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/[0.06] p-4 text-[13px] text-fg-soft" role="note">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
          <p>
            <strong className="font-semibold text-warn">Version {data.version}.</strong> Every formula on this page is implemented in the demo
            code, and none has been validated against real ball-by-ball data. Parameters are research choices open to change, not official
            competition rules.
          </p>
        </div>

        <Section id="pressure" title="Pressure definition">
          <p>
            A delivery is <b className="text-fg">under pressure</b> when a Pressure Index (PI) built from the match state crosses a threshold. PI is a
            0 to 100 score. It is computed separately for each innings because a chase has a target and a first innings does not.
          </p>
          <Formula label="Pressure Index">
            <V>PI</V> = 100 × (<V>w<Sub>r</Sub></V>·<V>f<Sub>r</Sub></V> + <V>w<Sub>w</Sub></V>·<V>f<Sub>w</Sub></V> + <V>w<Sub>s</Sub></V>·<V>f<Sub>s</Sub></V>) ÷ (<V>w<Sub>r</Sub></V> + <V>w<Sub>w</Sub></V> + <V>w<Sub>s</Sub></V>)
          </Formula>
          <Formula label="Pressure level">
            Low if <V>PI</V> &lt; <V>t<Sub>low</Sub></V>; Medium if <V>t<Sub>low</Sub></V> ≤ <V>PI</V> &lt; <V>t<Sub>high</Sub></V>; High otherwise
          </Formula>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[420px] text-[13px]">
              <caption className="sr-only">Default pressure parameters</caption>
              <thead>
                <tr className="border-b border-line bg-bg-raised text-[11px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-3 py-2 text-left font-medium" scope="col">Innings</th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">w<sub>r</sub> : w<sub>w</sub> : w<sub>s</sub></th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">t<sub>low</sub></th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">t<sub>high</sub></th>
                </tr>
              </thead>
              <tbody>
                {[['First', first], ['Second', second]].map(function renderRow(item) {
                  return (
                    <tr key={item[0]} className="border-b border-line last:border-b-0">
                      <th scope="row" className="px-3 py-2 text-left font-medium text-fg">{item[0]}</th>
                      <td className="num px-3 py-2 text-right">{item[1].weights.rate} : {item[1].weights.wickets} : {item[1].weights.stage}</td>
                      <td className="num px-3 py-2 text-right">{item[1].thresholds.lowMax}</td>
                      <td className="num px-3 py-2 text-right">{item[1].thresholds.mediumMax}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-muted">Weights and thresholds can be changed on the Pressure Analysis page. Those changes are local to the browser session.</p>
        </Section>

        <Section id="features" title="Feature engineering">
          <p>Three components, each scaled to the range 0 to 1:</p>
          <Formula label="Run-rate component">
            First innings: <V>f<Sub>r</Sub></V> = clamp((<span>{RATE_REFERENCE.parRate}</span> − <V>CRR</V>) ÷ ({RATE_REFERENCE.parRate} − {RATE_REFERENCE.slowRate}), 0, 1)
            <br />
            Second innings: <V>f<Sub>r</Sub></V> = clamp((<V>RRR</V> − {RATE_REFERENCE.chaseEasy}) ÷ ({RATE_REFERENCE.chaseHard} − {RATE_REFERENCE.chaseEasy}), 0, 1)
          </Formula>
          <Formula label="Wickets and stage components">
            <V>f<Sub>w</Sub></V> = <V>wickets lost</V> ÷ 10 &nbsp;&nbsp; <V>f<Sub>s</Sub></V> = 1 − <V>balls remaining</V> ÷ {TOTAL_BALLS}
          </Formula>
          <p>
            <V>CRR</V> is the current run rate and <V>RRR</V> the required run rate, both in runs per over. The reference points ({RATE_REFERENCE.parRate},{' '}
            {RATE_REFERENCE.slowRate}, {RATE_REFERENCE.chaseEasy}, {RATE_REFERENCE.chaseHard}) are assumptions, not measured values.
          </p>
        </Section>

        <Section id="batting" title="Batting rating methodology">
          <p>
            A batter’s pressure rating shrinks pressure numbers toward the league's, so a short hot streak cannot top the table. With prior weight{' '}
            <V>k</V> = {rating.batting.priorBalls} balls, pressure runs <V>R<Sub>p</Sub></V>, pressure balls <V>B<Sub>p</Sub></V> and league pressure strike rate <V>SR<Sub>L</Sub></V>:
          </p>
          <Formula label="Shrunk strike rate">
            <V>SR′</V> = (<V>R<Sub>p</Sub></V> + <V>k</V>·<V>SR<Sub>L</Sub></V> ÷ 100) ÷ (<V>B<Sub>p</Sub></V> + <V>k</V>) × 100
          </Formula>
          <Formula label="Indices and rating">
            <V>I<Sub>SR</Sub></V> = clamp(<V>SR′</V> ÷ <V>SR<Sub>L</Sub></V>, {rating.indexLimits.min}, {rating.indexLimits.max}) &nbsp; <V>I<Sub>D</Sub></V> = clamp(<V>d<Sub>L</Sub></V> ÷ <V>d′</V>, {rating.indexLimits.min}, {rating.indexLimits.max})
            <br />
            <V>Rating</V> = clamp(50 + {rating.scale}·({rating.batting.weightStrikeRate}·<V>I<Sub>SR</Sub></V> + {rating.batting.weightDismissal}·<V>I<Sub>D</Sub></V> − 1), 0, 100)
          </Formula>
          <p><V>d′</V> is the shrunk dismissals-per-ball under pressure and <V>d<Sub>L</Sub></V> the league figure. A rating of 50 means league average.</p>
        </Section>

        <Section id="bowling" title="Bowling rating methodology">
          <p>The same shrinkage idea, using economy and wicket rate. Lower economy and higher wicket rate raise the rating.</p>
          <Formula label="Shrunk economy">
            <V>E′</V> = (<V>R<Sub>c</Sub></V> + <V>k</V>·<V>E<Sub>L</Sub></V> ÷ 6) ÷ (<V>B<Sub>p</Sub></V> + <V>k</V>) × 6 &nbsp;&nbsp; (<V>k</V> = {rating.bowling.priorBalls})
          </Formula>
          <Formula label="Indices and rating">
            <V>I<Sub>E</Sub></V> = clamp(<V>E<Sub>L</Sub></V> ÷ <V>E′</V>, {rating.indexLimits.min}, {rating.indexLimits.max}) &nbsp; <V>I<Sub>W</Sub></V> = clamp(<V>w′</V> ÷ <V>w<Sub>L</Sub></V>, {rating.indexLimits.min}, {rating.indexLimits.max})
            <br />
            <V>Rating</V> = clamp(50 + {rating.scale}·({rating.bowling.weightEconomy}·<V>I<Sub>E</Sub></V> + {rating.bowling.weightWickets}·<V>I<Sub>W</Sub></V> − 1), 0, 100)
          </Formula>
          <p>The 0.6/0.4 batting and 0.55/0.45 bowling weights are judgement calls and are not tuned on data.</p>
        </Section>

        <Section id="baselines" title="Normal vs pressure baselines">
          <p>Each player is compared with their own history and with the pool. Both uses are shown in the UI:</p>
          <Formula label="Own-baseline improvement">
            Batting: Δ<V>SR</V> = <V>SR<Sub>pressure</Sub></V> − <V>SR<Sub>normal</Sub></V> &nbsp;&nbsp; Bowling: Δ<V>E</V> = <V>E<Sub>normal</Sub></V> − <V>E<Sub>pressure</Sub></V>
          </Formula>
          <p>
            Bowling improvement is flipped so that a positive number is always good. The league baseline is the pooled pressure rate over every record in
            the current filter selection, so ratings move when filters change.
          </p>
        </Section>

        <Section id="sample" title="Sample-size eligibility">
          <p>A player appears in the leaderboards only with a minimum number of pressure balls. Confidence tiers describe how much to trust the number.</p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[420px] text-[13px]">
              <caption className="sr-only">Sample-size thresholds</caption>
              <thead>
                <tr className="border-b border-line bg-bg-raised text-[11px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-3 py-2 text-left font-medium" scope="col">Discipline</th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">Minimum to rank</th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">Medium confidence</th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">High confidence</th>
                </tr>
              </thead>
              <tbody>
                {['batting', 'bowling'].map(function renderRow(kind) {
                  return (
                    <tr key={kind} className="border-b border-line last:border-b-0">
                      <th scope="row" className="px-3 py-2 text-left font-medium capitalize text-fg">{kind}</th>
                      <td className="num px-3 py-2 text-right">{p.minPressureBalls[kind]} balls</td>
                      <td className="num px-3 py-2 text-right">≥ {p.confidence[kind].medium} balls</td>
                      <td className="num px-3 py-2 text-right">≥ {p.confidence[kind].high} balls</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="reliability" title="Statistical reliability">
          <Formula label="Reliability">
            <V>Reliability</V> = <V>B<Sub>p</Sub></V> ÷ (<V>B<Sub>p</Sub></V> + <V>k</V>) × 100%
          </Formula>
          <p>
            Reliability is the weight the player’s own pressure data gets in the shrinkage above, so it is a transparent heuristic. It is not a confidence
            interval, and no p-values or intervals are calculated yet. Consistency on player profiles uses the coefficient of variation:
          </p>
          <Formula>
            <V>CV</V> = <V>σ</V> ÷ <V>μ</V> &nbsp; over per-match runs (batters) or per-match economy (bowlers)
          </Formula>
        </Section>

        <Section id="competitions" title="IPL / T20I comparison">
          <p>
            IPL and T20I differ in scoring environment, opposition depth and match structure. The pooled figures below come from the {data.meta.isDemo ? 'synthetic demo data' : 'connected data source'}.
          </p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[560px] text-[13px]">
              <caption className="sr-only">Competition comparison</caption>
              <thead>
                <tr className="border-b border-line bg-bg-raised text-[11px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-3 py-2 text-left font-medium" scope="col">Competition</th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">Matches</th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">Pressure share</th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">SR press. / norm.</th>
                  <th className="px-3 py-2 text-right font-medium" scope="col">Econ press. / norm.</th>
                </tr>
              </thead>
              <tbody>
                {data.competitionComparison.map(function renderRow(c) {
                  return (
                    <tr key={c.competition} className="border-b border-line last:border-b-0">
                      <th scope="row" className="px-3 py-2 text-left font-medium text-fg">{c.competition}</th>
                      <td className="num px-3 py-2 text-right">{formatNumber(c.matches)}</td>
                      <td className="num px-3 py-2 text-right">{formatPercent(c.pressureShareOfBalls, 1)}</td>
                      <td className="num px-3 py-2 text-right">{formatNumber(c.pressureStrikeRate, 1)} / {formatNumber(c.normalStrikeRate, 1)}</td>
                      <td className="num px-3 py-2 text-right">{formatNumber(c.pressureEconomy, 2)} / {formatNumber(c.normalEconomy, 2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-muted">
            Ratings use the pooled baseline of the selected filter. With "All" selected, IPL and T20I players are rated against one shared baseline, which
            favours whichever competition scores faster. Filter to one competition for a like-for-like ranking.
          </p>
        </Section>

        <Section id="status" title="Validation status">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[560px] text-[13px]">
              <caption className="sr-only">Validation status of each method</caption>
              <thead>
                <tr className="border-b border-line bg-bg-raised text-[11px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-3 py-2 text-left font-medium" scope="col">Method</th>
                  <th className="px-3 py-2 text-left font-medium" scope="col">Status</th>
                  <th className="px-3 py-2 text-left font-medium" scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                <StatusRow name="Pressure Index" status="implemented" note="Weights and thresholds are assumptions. No outcome-based calibration." />
                <StatusRow name="Batting and bowling ratings" status="implemented" note="Shrinkage priors and weights not tuned on held-out data." />
                <StatusRow name="Reliability and confidence tiers" status="implemented" note="Heuristic tiers, not statistical intervals." />
                <StatusRow name="Confidence intervals on ratings" status="planned" note="Not implemented." />
                <StatusRow name="Predictive validation (ratings vs later seasons)" status="planned" note="Not implemented. Needs real data." />
                <StatusRow name="Opposition and venue adjustment" status="planned" note="Not implemented." />
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="limitations" title="Limitations">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>All numbers in demo mode are synthetic. Players, teams and results are invented.</li>
            <li>In demo mode, pressure balls in the player data are tagged by innings position, not by the Pressure Index.</li>
            <li>The index ignores batter quality, bowler quality, venue, pitch, dew and the powerplay and death-over context beyond the stage term.</li>
            <li>Pressure balls are a small slice of any career, so ratings carry wide uncertainty even with shrinkage.</li>
            <li>Ratings depend on the current filter selection and are not comparable across different filters.</li>
            <li>Dismissals and wickets are rare events, which is why indices are clamped to {rating.indexLimits.min}–{rating.indexLimits.max}.</li>
          </ul>
        </Section>
      </div>
    </div>
  )
}

export default function MethodologyPage() {
  const query = useApi(function load() {
    return getMethodology()
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="Methodology"
        title="How the ratings work"
        description="Definitions, formulas and limitations behind the pressure analysis. Nothing here is presented as validated."
        actions={query.data && query.data.meta.isDemo ? <Badge tone="warn">Demo data</Badge> : null}
      />
      <AsyncView query={query} skeleton={<PageSkeleton />}>
        {function render(data) {
          return <MethodologyBody data={data} />
        }}
      </AsyncView>
    </>
  )
}
