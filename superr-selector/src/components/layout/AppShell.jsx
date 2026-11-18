import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DesktopSidebar, MobileSidebar } from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import DemoBanner from './DemoBanner.jsx'
import { PageSkeleton } from '../ui/Skeleton.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'

export default function AppShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useLocalStorage('superr.sidebarCollapsed', false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile menu and return to the top whenever the route changes.
  useEffect(
    function onRouteChange() {
      setMobileOpen(false)
      window.scrollTo(0, 0)
    },
    [location.pathname],
  )

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-[90] rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>

      <DesktopSidebar
        collapsed={collapsed}
        onToggle={function toggle() {
          setCollapsed(!collapsed)
        }}
      />
      <MobileSidebar
        open={mobileOpen}
        onClose={function close() {
          setMobileOpen(false)
        }}
      />

      <div className={'min-h-screen transition-[padding] duration-200 ' + (collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <Topbar
          onOpenMenu={function open() {
            setMobileOpen(true)
          }}
        />
        <DemoBanner />
        <main id="main" tabIndex={-1} className="mx-auto max-w-[1440px] px-4 py-6 outline-none sm:px-6 lg:px-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
