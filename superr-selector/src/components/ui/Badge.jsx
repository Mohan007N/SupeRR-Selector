import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import Tooltip from './Tooltip.jsx'
import { CONFIDENCE_THRESHOLDS } from '../../utils/stats.js'
import { formatNumber, formatSigned } from '../../utils/format.js'

const TONES = {
  neutral: 'border-line-strong bg-panel-2 text-fg-soft',
  accent: 'border-accent-line bg-accent-soft text-accent',
  good: 'border-good/30 bg-good/10 text-good',
  warn: 'border-warn/30 bg-warn/10 text-warn',
  bad: 'border-bad/30 bg-bad/10 text-bad',
  info: 'border-info/30 bg-info/10 text-info',
}

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ' +
        TONES[tone] +
        ' ' +
        className
      }
    >
      {children}
    </span>
  )
}

const CONFIDENCE_TONE = { High: 'good', Medium: 'warn', Low: 'bad' }

export function ConfidenceBadge({ level, type, pressureBalls }) {
  const limits = CONFIDENCE_THRESHOLDS[type]
  const hint =
    'Reliability tier from pressure-ball sample: High ≥ ' + limits.high + ', Medium ≥ ' + limits.medium +
    ', Low below that.' + (pressureBalls !== undefined ? ' This player: ' + formatNumber(pressureBalls) + ' balls.' : '')
  return (
    <Tooltip label={hint}>
      <span tabIndex={0} className="inline-flex rounded-full">
        <Badge tone={CONFIDENCE_TONE[level]}>
          <span
            className={
              'h-1.5 w-1.5 rounded-full ' +
              (level === 'High' ? 'bg-good' : level === 'Medium' ? 'bg-warn' : 'bg-bad')
            }
            aria-hidden="true"
          />
          {level}
        </Badge>
      </span>
    </Tooltip>
  )
}

// Signed value with an arrow. `higherIsBetter` decides whether positive is green.
export function DeltaBadge({ value, digits = 1, higherIsBetter = true }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-faint">—</span>
  }
  const isGood = higherIsBetter ? value > 0 : value < 0
  const isBad = higherIsBetter ? value < 0 : value > 0
  let color = 'text-muted'
  let Icon = Minus
  if (isGood) {
    color = 'text-good'
  }
  if (isBad) {
    color = 'text-bad'
  }
  if (value > 0) {
    Icon = ArrowUpRight
  } else if (value < 0) {
    Icon = ArrowDownRight
  }
  return (
    <span className={'num inline-flex items-center gap-0.5 font-medium ' + color}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {formatSigned(value, digits)}
    </span>
  )
}

export function RatingPill({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-faint">—</span>
  }
  let tone = 'bg-bad/15 text-bad'
  if (value >= 60) {
    tone = 'bg-accent-soft text-accent'
  } else if (value >= 45) {
    tone = 'bg-warn/15 text-warn'
  }
  return (
    <span className={'num inline-flex min-w-[2.75rem] justify-center rounded-md px-1.5 py-0.5 text-[13px] font-semibold ' + tone}>
      {formatNumber(value, 1)}
    </span>
  )
}

export function DemoTag({ className = '' }) {
  return (
    <Badge tone="warn" className={className}>
      Demo data
    </Badge>
  )
}
