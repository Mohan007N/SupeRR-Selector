import { useRef } from 'react'

// Accessible tab list. Arrow keys, Home and End move between tabs.
// Pair with <TabPanel> using the same idPrefix.
export function Tabs({ tabs, value, onChange, idPrefix, label, size = 'md' }) {
  const refs = useRef([])

  function focusTab(index) {
    const tab = tabs[index]
    onChange(tab.id)
    if (refs.current[index]) {
      refs.current[index].focus()
    }
  }

  function handleKeyDown(event, index) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusTab((index + 1) % tabs.length)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusTab((index - 1 + tabs.length) % tabs.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusTab(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusTab(tabs.length - 1)
    }
  }

  const padding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-[13px]'

  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-bg-raised p-1"
    >
      {tabs.map(function renderTab(tab, index) {
        const selected = tab.id === value
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            ref={function setRef(node) {
              refs.current[index] = node
            }}
            type="button"
            role="tab"
            id={idPrefix + '-tab-' + tab.id}
            aria-selected={selected}
            aria-controls={idPrefix + '-panel-' + tab.id}
            tabIndex={selected ? 0 : -1}
            onClick={function select() {
              onChange(tab.id)
            }}
            onKeyDown={function keys(event) {
              handleKeyDown(event, index)
            }}
            className={
              'inline-flex items-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors ' +
              padding +
              ' ' +
              (selected ? 'bg-panel-3 text-fg shadow-sm' : 'text-muted hover:text-fg')
            }
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ idPrefix, id, value, children, className = '' }) {
  if (id !== value) {
    return null
  }
  return (
    <div
      role="tabpanel"
      id={idPrefix + '-panel-' + id}
      aria-labelledby={idPrefix + '-tab-' + id}
      tabIndex={0}
      className={'outline-offset-4 ' + className}
    >
      {children}
    </div>
  )
}
