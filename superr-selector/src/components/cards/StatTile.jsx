export default function StatTile({ label, value, sub, tone }) {
  const color = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : tone === 'accent' ? 'text-accent' : 'text-fg'
  return (
    <div className="rounded-xl border border-line bg-bg-raised px-3.5 py-3">
      <p className="eyebrow">{label}</p>
      <p className={'num mt-1 font-display text-xl font-semibold ' + color}>{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-muted">{sub}</p> : null}
    </div>
  )
}
