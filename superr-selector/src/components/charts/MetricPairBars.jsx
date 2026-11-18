import { CHART_COLORS } from './chartTheme.js'
import { formatNumber } from '../../utils/format.js'

// Row-by-row pressure vs normal bars. Each row is scaled on its own, so metrics with
// different units (strike rate, %, per-over) sit side by side without distortion.
// metrics = [{ key, label, unit, digits, higherIsBetter, pressure, normal }]
export default function MetricPairBars({ metrics }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.pressure }} aria-hidden="true" />
          Pressure
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.normal }} aria-hidden="true" />
          Normal
        </span>
      </div>
      {metrics.map(function renderMetric(metric) {
        const p = metric.pressure
        const n = metric.normal
        const top = Math.max(p || 0, n || 0, 0.0001)

        let verdict = null
        if (p !== null && n !== null && p !== n) {
          const better = metric.higherIsBetter ? p > n : p < n
          verdict = better ? 'Better under pressure' : 'Worse under pressure'
        }

        return (
          <div key={metric.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-medium text-fg">{metric.label}</p>
              <p className="text-[11px] text-faint">{metric.unit}</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-panel-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: p === null ? '0%' : (p / top) * 100 + '%', backgroundColor: CHART_COLORS.pressure }}
                  />
                </div>
                <span className="num w-14 text-right text-[13px] text-fg">{formatNumber(p, metric.digits)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-panel-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: n === null ? '0%' : (n / top) * 100 + '%', backgroundColor: CHART_COLORS.normal }}
                  />
                </div>
                <span className="num w-14 text-right text-[13px] text-fg-soft">{formatNumber(n, metric.digits)}</span>
              </div>
            </div>
            {verdict ? (
              <p className={'mt-1 text-[11px] ' + (verdict.indexOf('Better') === 0 ? 'text-good' : 'text-bad')}>{verdict}</p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
