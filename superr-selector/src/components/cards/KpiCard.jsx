import { motion } from 'framer-motion'
import Tooltip from '../ui/Tooltip.jsx'
import { Info } from 'lucide-react'

export default function KpiCard({ label, value, caption, icon: Icon, hint, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="card card-pad"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow flex items-center gap-1.5">
          {label}
          {hint ? (
            <Tooltip label={hint}>
              <button type="button" className="rounded text-faint hover:text-fg" aria-label={'About ' + label}>
                <Info className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          ) : null}
        </p>
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="num mt-3 font-display text-3xl font-semibold tracking-tight text-fg">{value}</p>
      {caption ? <p className="mt-1.5 text-xs text-muted">{caption}</p> : null}
    </motion.div>
  )
}
