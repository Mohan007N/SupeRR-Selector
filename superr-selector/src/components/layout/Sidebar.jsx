import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { APP_NAME, APP_SEASON } from '../../config.js'
import { NAV_GROUPS } from '../../utils/navConfig.js'
import Tooltip from '../ui/Tooltip.jsx'
import { useEscapeKey } from '../../hooks/useEscapeKey.js'

function Brand({ collapsed }) {
  return (
    <div className={'flex items-center gap-3 ' + (collapsed ? 'justify-center' : '')}>
      <img src="/favicon.svg" alt="" className="h-8 w-8 shrink-0" />
      {collapsed ? null : (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-[15px] font-semibold text-fg">{APP_NAME}</p>
          <p className="text-[11px] text-accent">{APP_SEASON}</p>
        </div>
      )}
    </div>
  )
}

function NavList({ collapsed, onNavigate }) {
  return (
    <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map(function renderGroup(group) {
        return (
          <div key={group.label} className="mb-5">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-line" aria-hidden="true" />
            ) : (
              <p className="eyebrow mb-2 px-3">{group.label}</p>
            )}
            <ul className="space-y-1">
              {group.items.map(function renderItem(item) {
                const Icon = item.icon
                const link = (
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onNavigate}
                    aria-label={collapsed ? item.label : undefined}
                    className={function linkClass({ isActive }) {
                      return (
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ' +
                        (collapsed ? 'justify-center ' : '') +
                        (isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-panel-2 hover:text-fg')
                      )
                    }}
                  >
                    {function renderChildren({ isActive }) {
                      return (
                        <>
                          {isActive ? (
                            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" aria-hidden="true" />
                          ) : null}
                          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                          {collapsed ? null : <span className="truncate">{item.label}</span>}
                        </>
                      )
                    }}
                  </NavLink>
                )
                return (
                  <li key={item.path}>
                    {collapsed ? (
                      <Tooltip label={item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export function DesktopSidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-bg-raised lg:flex"
    >
      <div className={'flex h-16 items-center border-b border-line ' + (collapsed ? 'justify-center px-2' : 'px-5')}>
        <Brand collapsed={collapsed} />
      </div>
      <NavList collapsed={collapsed} />
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-muted transition-colors hover:bg-panel-2 hover:text-fg ' +
            (collapsed ? 'justify-center' : '')
          }
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}

export function MobileSidebar({ open, onClose }) {
  useEscapeKey(open, onClose)
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-bg-raised"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Brand collapsed={false} />
              <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close menu">
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavList collapsed={false} onNavigate={onClose} />
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
