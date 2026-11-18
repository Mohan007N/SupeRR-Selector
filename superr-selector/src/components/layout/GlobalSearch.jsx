import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search, Swords, Target } from 'lucide-react'
import { getPlayerDirectory } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { useProfile } from '../../context/ProfileContext.jsx'
import { allNavItems } from '../../utils/navConfig.js'

const MAX_PLAYER_RESULTS = 7

export default function GlobalSearch() {
  const navigate = useNavigate()
  const { openProfile } = useProfile()
  const directory = useApi(function load() {
    return getPlayerDirectory()
  }, [])

  const listId = useId()
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(
    function buildItems() {
      const text = query.trim().toLowerCase()
      const list = []

      const pages = allNavItems()
      const players = directory.data ? directory.data.players : []

      if (text.length > 0) {
        let count = 0
        for (let i = 0; i < players.length && count < MAX_PLAYER_RESULTS; i++) {
          const p = players[i]
          const haystack = (p.name + ' ' + p.teams.join(' ') + ' ' + p.competitions.join(' ') + ' ' + p.type).toLowerCase()
          if (haystack.indexOf(text) !== -1) {
            list.push({ kind: 'player', key: 'player-' + p.type + p.id, player: p })
            count += 1
          }
        }
      }
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        if (text.length === 0 || (page.label + ' ' + page.description).toLowerCase().indexOf(text) !== -1) {
          list.push({ kind: 'page', key: 'page-' + page.path, page: page })
        }
      }
      return list
    },
    [query, directory.data],
  )

  // "/" focuses the search box from anywhere that is not a text field.
  useEffect(function bindShortcut() {
    function handleKey(event) {
      const tag = event.target && event.target.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (event.target && event.target.isContentEditable)
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        if (inputRef.current) {
          inputRef.current.focus()
        }
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return function cleanup() {
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  useEffect(function closeOnOutsideClick() {
    function handlePointer(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointer)
    return function cleanup() {
      document.removeEventListener('mousedown', handlePointer)
    }
  }, [])

  function choose(item) {
    if (item.kind === 'player') {
      openProfile(item.player.type, item.player.id)
    } else {
      navigate(item.page.path)
    }
    setOpen(false)
    setQuery('')
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex(items.length === 0 ? 0 : (activeIndex + 1) % items.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(items.length === 0 ? 0 : (activeIndex - 1 + items.length) % items.length)
    } else if (event.key === 'Enter') {
      if (open && items[activeIndex]) {
        event.preventDefault()
        choose(items[activeIndex])
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
      if (query.length === 0 && inputRef.current) {
        inputRef.current.blur()
      }
    }
  }

  const activeId = open && items[activeIndex] ? listId + '-' + activeIndex : undefined
  const hasPlayers = items.some(function isPlayer(item) {
    return item.kind === 'player'
  })

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <label htmlFor={listId + '-input'} className="sr-only">
        Search players and pages
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
      <input
        id={listId + '-input'}
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        value={query}
        placeholder="Search players, teams, pages"
        onChange={function change(event) {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={function focus() {
          setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        className="field pl-9 pr-9"
      />
      <span className="kbd absolute right-3 top-1/2 hidden -translate-y-1/2 md:inline-flex" aria-hidden="true">
        /
      </span>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line-strong bg-panel p-1.5 shadow-xl shadow-black/40">
          {directory.error ? (
            <p className="px-3 py-2 text-xs text-warn">
              Player search is unavailable right now. Page results still work.
            </p>
          ) : null}
          {query.trim().length > 0 && !hasPlayers && !directory.error && !directory.loading ? (
            <p className="px-3 py-2 text-xs text-muted">No players match “{query.trim()}”.</p>
          ) : null}
          {items.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-muted">No results.</p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search results">
              {items.map(function renderItem(item, index) {
                const selected = index === activeIndex
                let icon = null
                let primary = ''
                let secondary = ''
                if (item.kind === 'player') {
                  const Icon = item.player.type === 'batting' ? Swords : Target
                  icon = <Icon className="h-4 w-4" aria-hidden="true" />
                  primary = item.player.name
                  secondary = (item.player.type === 'batting' ? 'Batter' : 'Bowler') + ' · ' + item.player.teams.join(' / ')
                } else {
                  const Icon = item.page.icon
                  icon = <Icon className="h-4 w-4" aria-hidden="true" />
                  primary = item.page.label
                  secondary = 'Page · ' + item.page.description
                }
                return (
                  <li
                    key={item.key}
                    id={listId + '-' + index}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={function hover() {
                      setActiveIndex(index)
                    }}
                    onMouseDown={function pick(event) {
                      event.preventDefault()
                      choose(item)
                    }}
                    className={
                      'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ' +
                      (selected ? 'bg-panel-3 text-fg' : 'text-fg-soft')
                    }
                  >
                    <span className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-md ' + (item.kind === 'player' ? 'bg-accent-soft text-accent' : 'bg-panel-2 text-muted')}>
                      {icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{primary}</span>
                      <span className="block truncate text-xs text-muted">{secondary}</span>
                    </span>
                    {selected ? <CornerDownLeft className="h-3.5 w-3.5 text-faint" aria-hidden="true" /> : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
