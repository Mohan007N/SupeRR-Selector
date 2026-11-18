import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, ShieldCheck, TrendingUp, Sparkles, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import Badge, { DeltaBadge } from '../ui/Badge.jsx'
import { SHORTLIST_BATTERS, SHORTLIST_BOWLERS } from '../../data/shortlistData.js'
import { formatNumber, formatPercent } from '../../utils/format.js'
import { useProfile } from '../../context/ProfileContext.jsx'

const EVIDENCE_STYLE = {
  Stronger: 'border-good/30 bg-good/10 text-good',
  Moderate: 'border-warn/30 bg-warn/10 text-warn',
  Limited: 'border-line-strong bg-panel-2 text-fg-soft',
}

export default function ShortlistSection({ type }) {
  const isBatting = type === 'batting'
  const { openProfile } = useProfile()
  const players = isBatting ? SHORTLIST_BATTERS : SHORTLIST_BOWLERS
  const [expandedId, setExpandedId] = useState(null)
  const [filterEvidence, setFilterEvidence] = useState('All')

  const filtered = filterEvidence === 'All'
    ? players
    : players.filter((p) => p.evidence === filterEvidence)

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-accent-line bg-gradient-to-br from-panel via-panel-2 to-accent-soft p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-bg shadow-xs">
                <Trophy className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {isBatting ? '06 Final Batting Shortlist' : '07 Final Bowling Shortlist'}
              </span>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                IPL 2027 Auction Scouting
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-fg">
              {isBatting ? 'Top 10 Batters Under Pressure' : 'Top 10 Bowlers Under Pressure'}
            </h3>
            <p className="max-w-2xl text-xs text-fg-soft leading-relaxed">
              {isBatting
                ? 'Ranked strictly by the pressure rating index. Every player includes verified strike rate uplift, pressure sample volume, and comprehensive scouting rationales.'
                : 'Combines wicket threat, run prevention, dot-ball pressure, comparison against non-pressure economy baseline, and exposure reliability.'}
            </p>
          </div>

          {/* Evidence filter pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <span className="text-[11px] font-medium text-faint">Evidence:</span>
            {['All', 'Stronger', 'Moderate', 'Limited'].map((ev) => (
              <button
                key={ev}
                type="button"
                onClick={() => setFilterEvidence(ev)}
                className={
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ' +
                  (filterEvidence === ev
                    ? 'bg-fg text-bg shadow-xs'
                    : 'bg-panel-2 text-fg-soft hover:bg-panel hover:text-fg')
                }
              >
                {ev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 10 Player Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((p, idx) => {
          const isExpanded = expandedId === p.id || idx < 3
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="group flex flex-col justify-between rounded-xl border border-line bg-panel p-4 shadow-2xs transition-all hover:border-accent-line hover:shadow-xs"
            >
              <div>
                {/* Top row: Rank, Name, Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold ' +
                        (p.rank === 1
                          ? 'bg-accent text-bg shadow-xs'
                          : p.rank <= 3
                          ? 'bg-line-strong text-fg'
                          : 'bg-panel-2 text-fg-soft border border-line')
                      }
                    >
                      #{p.rank}
                    </span>
                    <div>
                      <h4 className="font-display text-[15px] font-bold text-fg group-hover:text-accent transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-xs text-muted">
                        {p.teams.join(', ')} · {p.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={
                        'rounded-full border px-2 py-0.5 text-[11px] font-medium ' +
                        EVIDENCE_STYLE[p.evidence]
                      }
                    >
                      {p.evidence}
                    </span>
                  </div>
                </div>

                {/* Key Stat Tiles */}
                <div className="mt-3.5 grid grid-cols-4 gap-2 rounded-lg bg-panel-2/70 p-2.5 text-center">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-faint">Rating</span>
                    <span className="font-display text-base font-bold text-accent">
                      {formatNumber(p.ratingIndex, 2)}
                    </span>
                  </div>

                  {isBatting ? (
                    <>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-faint">P-Runs (Balls)</span>
                        <span className="font-display text-xs font-semibold text-fg">
                          {p.runs} <span className="text-muted">({p.balls})</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-faint">P-SR</span>
                        <span className="font-display text-xs font-semibold text-fg">
                          {formatNumber(p.pressureStrikeRate, 1)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-faint">Δ SR</span>
                        <span className="inline-block mt-0.5">
                          <DeltaBadge value={p.deltaSr} digits={1} />
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-faint">Wkts / Balls</span>
                        <span className="font-display text-xs font-semibold text-fg">
                          {p.wickets} <span className="text-muted">({p.balls}b)</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-faint">P-Econ</span>
                        <span className="font-display text-xs font-semibold text-fg">
                          {formatNumber(p.economy, 2)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-faint">Dot %</span>
                        <span className="font-display text-xs font-semibold text-good">
                          {p.dotPct}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Rationale & Scouting Qualifications */}
                <div className="mt-3">
                  <p className="text-xs text-fg-soft leading-relaxed italic border-l-2 border-accent/40 pl-2.5 py-0.5">
                    "{p.rationale}"
                  </p>
                </div>
              </div>

              {/* Action bar */}
              <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-2.5 text-xs text-muted">
                <span>{p.matches} matches evaluated</span>
                <button
                  type="button"
                  onClick={() => openProfile(type, p.id)}
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  View full analytics <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

