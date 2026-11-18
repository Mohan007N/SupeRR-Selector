import { useCallback, useEffect, useState } from 'react'
import { useDemo } from '../context/DemoContext.jsx'

// Runs an async fetcher whenever `deps` change.
// Returns { data, loading, error, reload, refreshing }.
//  - loading:    true until the first response (use for skeletons)
//  - refreshing: true while re-fetching with older data still on screen
export function useApi(fetcher, deps) {
  const demo = useDemo()
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(
    function runFetch() {
      let cancelled = false
      setState(function markLoading(previous) {
        return { data: previous.data, loading: true, error: null }
      })

      fetcher()
        .then(function onData(data) {
          if (!cancelled) {
            setState({ data: data, loading: false, error: null })
          }
        })
        .catch(function onError(error) {
          if (!cancelled) {
            setState({ data: null, loading: false, error: error })
          }
        })

      return function cleanup() {
        cancelled = true
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, demo.refreshKey, reloadTick],
  )

  const reload = useCallback(function reloadNow() {
    setReloadTick(function next(tick) {
      return tick + 1
    })
  }, [])

  return {
    data: state.data,
    loading: state.loading && state.data === null,
    refreshing: state.loading && state.data !== null,
    error: state.error,
    reload: reload,
  }
}
