import { PageSkeleton } from './Skeleton.jsx'
import { ErrorState } from './States.jsx'

// Renders the right state for a useApi() result:
// skeleton while loading, error with retry, or the content (dimmed while refreshing).
export default function AsyncView({ query, skeleton, children }) {
  if (query.error) {
    return <ErrorState error={query.error} onRetry={query.reload} />
  }
  if (query.loading || query.data === null) {
    return skeleton || <PageSkeleton />
  }
  return (
    <div
      className={'transition-opacity duration-200 ' + (query.refreshing ? 'opacity-60' : 'opacity-100')}
      aria-busy={query.refreshing}
    >
      {children(query.data)}
    </div>
  )
}
