import { createContext, useContext, useState } from 'react'
import { DEMO_MODE } from '../config.js'
import { demoControls } from '../data/demoControls.js'

const DemoContext = createContext(null)

export function DemoProvider({ children }) {
  const [simulateError, setSimulateError] = useState(false)
  // Bumping refreshKey makes every data hook fetch again.
  const [refreshKey, setRefreshKey] = useState(0)

  function toggleSimulateError() {
    const next = !simulateError
    demoControls.simulateError = next
    setSimulateError(next)
    setRefreshKey(refreshKey + 1)
  }

  const value = {
    isDemo: DEMO_MODE,
    simulateError: simulateError,
    toggleSimulateError: toggleSimulateError,
    refreshKey: refreshKey,
  }
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const value = useContext(DemoContext)
  if (value === null) {
    throw new Error('useDemo must be used inside DemoProvider')
  }
  return value
}
