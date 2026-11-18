import { Menu } from 'lucide-react'
import Breadcrumb from './Breadcrumb.jsx'
import GlobalSearch from './GlobalSearch.jsx'
import { DemoTag } from '../ui/Badge.jsx'
import { useDemo } from '../../context/DemoContext.jsx'

export default function Topbar({ onOpenMenu }) {
  const demo = useDemo()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="btn btn-ghost -ml-2 px-2 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumb />
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-none">
          <GlobalSearch />
          {demo.isDemo ? <DemoTag className="hidden md:inline-flex" /> : null}
        </div>
      </div>
    </header>
  )
}
