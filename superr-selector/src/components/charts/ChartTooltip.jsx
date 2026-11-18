// Dark tooltip used by every Recharts chart.
export default function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const heading = labelFormatter ? labelFormatter(label, payload) : label

  return (
    <div className="rounded-lg border border-line-strong bg-panel-3 px-3 py-2 text-xs shadow-lg shadow-black/40">
      {heading !== undefined && heading !== null && heading !== '' ? (
        <p className="mb-1 font-medium text-fg">{heading}</p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map(function renderItem(item, index) {
          const swatch = item.color || item.fill || item.stroke
          const text = valueFormatter ? valueFormatter(item.value, item) : item.value
          return (
            <li key={index} className="flex items-center gap-2 text-fg-soft">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: swatch }} aria-hidden="true" />
              <span>{item.name}</span>
              <span className="num ml-auto pl-3 font-medium text-fg">{text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
