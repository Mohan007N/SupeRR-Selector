export function Skeleton({ className = '' }) {
  return <div className={'animate-pulse rounded-lg bg-panel-2 ' + className} aria-hidden="true" />
}

export function KpiSkeletonRow({ count = 4 }) {
  const items = []
  for (let i = 0; i < count; i++) {
    items.push(
      <div key={i} className="card card-pad">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-8 w-28" />
        <Skeleton className="mt-3 h-3 w-36" />
      </div>,
    )
  }
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{items}</div>
}

export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className="card card-pad">
      <Skeleton className="h-4 w-40" />
      <Skeleton className={'mt-5 w-full ' + height} />
    </div>
  )
}

export function TableSkeleton({ rows = 8 }) {
  const items = []
  for (let i = 0; i < rows; i++) {
    items.push(<Skeleton key={i} className="h-10 w-full" />)
  }
  return (
    <div className="card card-pad space-y-2" role="status" aria-label="Loading table">
      {items}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <KpiSkeletonRow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  )
}
