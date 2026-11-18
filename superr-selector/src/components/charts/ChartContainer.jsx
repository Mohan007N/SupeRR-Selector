// Card wrapper for every chart: title, optional subtitle/actions, fixed-height plot area.
export default function ChartContainer({ title, subtitle, actions, height = 280, children, footer, label }) {
  return (
    <figure className="card card-pad flex min-w-0 flex-col" aria-label={label || title}>
      <figcaption className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold text-fg">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </figcaption>
      <div style={{ height: height }} className="min-w-0">
        {children}
      </div>
      {footer ? <div className="mt-3 text-xs text-faint">{footer}</div> : null}
    </figure>
  )
}
