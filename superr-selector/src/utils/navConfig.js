import { FlaskConical, Gauge, GitCompareArrows, LayoutDashboard, Swords, Target, Trophy } from 'lucide-react'

// Single source of truth for navigation, breadcrumbs and global-search page results.
export const NAV_GROUPS = [
  {
    label: 'Analytics',
    items: [
      { path: '/', label: 'Overview', icon: LayoutDashboard, description: 'League-wide pressure performance' },
      { path: '/batting', label: 'Batting Analytics', icon: Swords, description: 'Batter tables and profiles' },
      { path: '/bowling', label: 'Bowling Analytics', icon: Target, description: 'Bowler tables and profiles' },
    ],
  },
  {
    label: 'Selection',
    items: [
      { path: '/rankings', label: 'Player Rankings', icon: Trophy, description: 'Top-10 pressure leaderboards' },
      { path: '/comparison', label: 'Player Comparison', icon: GitCompareArrows, description: 'Two players, side by side' },
    ],
  },
  {
    label: 'Research',
    items: [
      { path: '/pressure', label: 'Pressure Analysis', icon: Gauge, description: 'Define and explore pressure' },
    ],
  },
]

export function allNavItems() {
  const items = []
  for (let g = 0; g < NAV_GROUPS.length; g++) {
    for (let i = 0; i < NAV_GROUPS[g].items.length; i++) {
      items.push({ ...NAV_GROUPS[g].items[i], group: NAV_GROUPS[g].label })
    }
  }
  return items
}

export function findNavItem(pathname) {
  const items = allNavItems()
  for (let i = 0; i < items.length; i++) {
    if (items[i].path === pathname) {
      return items[i]
    }
  }
  return null
}
