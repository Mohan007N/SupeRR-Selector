import { RefreshCw, SearchX, TriangleAlert } from 'lucide-react'

export function EmptyState({ title, message, action, icon: Icon = SearchX }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-panel-2 text-muted">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-display text-[15px] font-semibold text-fg">{title}</h3>
      {message ? <p className="mt-1 max-w-md text-[13px] text-muted">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-center border-bad/30 px-6 py-12 text-center" role="alert">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-bad/30 bg-bad/10 text-bad">
        <TriangleAlert className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-display text-[15px] font-semibold text-fg">Could not load this data</h3>
      <p className="mt-1 max-w-md text-[13px] text-muted">
        {error && error.message ? error.message : 'Something went wrong while talking to the data service.'}
      </p>
      {onRetry ? (
        <button type="button" className="btn mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  )
}
