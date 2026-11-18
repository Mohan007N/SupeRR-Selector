import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { APP_NAME } from '../../config.js'
import { findNavItem } from '../../utils/navConfig.js'

export default function Breadcrumb() {
  const location = useLocation()
  const current = findNavItem(location.pathname)

  const crumbs = [{ label: APP_NAME, to: '/' }]
  if (current && current.path !== '/') {
    crumbs.push({ label: current.group })
    crumbs.push({ label: current.label })
  } else if (current) {
    crumbs.push({ label: current.label })
  } else {
    crumbs.push({ label: 'Not found' })
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
      <ol className="flex items-center gap-1.5 text-[13px]">
        {crumbs.map(function renderCrumb(crumb, index) {
          const isLast = index === crumbs.length - 1
          return (
            <li key={crumb.label + index} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" /> : null}
              {crumb.to && !isLast ? (
                <Link to={crumb.to} className="truncate text-muted transition-colors hover:text-fg">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={'truncate ' + (isLast ? 'font-medium text-fg' : 'text-muted')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
