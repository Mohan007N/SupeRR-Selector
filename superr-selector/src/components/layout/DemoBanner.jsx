import { FlaskConical } from 'lucide-react'
import { useDemo } from '../../context/DemoContext.jsx'
import Tooltip from '../ui/Tooltip.jsx'

export default function DemoBanner() {
  const demo = useDemo()
  if (!demo.isDemo) {
    return null
  }
  return (
    <div className="border-b border-warn/20 bg-warn/[0.06]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
        <p className="flex min-w-0 flex-1 items-start gap-2 text-xs text-warn">
          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Demo mode.</strong>{' '}
            <span className="text-fg-soft">
              Players, teams and every figure are synthetic and not verified results. Set VITE_DEMO_MODE=false and
              VITE_API_BASE_URL to connect the real backend.
            </span>
          </span>
        </p>
        <Tooltip label="Makes every data request fail so you can check the error and retry states.">
          <button
            type="button"
            onClick={demo.toggleSimulateError}
            aria-pressed={demo.simulateError}
            className={
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ' +
              (demo.simulateError
                ? 'border-bad/40 bg-bad/15 text-bad'
                : 'border-line-strong bg-panel-2 text-fg-soft hover:text-fg')
            }
          >
            Simulate API error: {demo.simulateError ? 'on' : 'off'}
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
