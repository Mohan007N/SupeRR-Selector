import { useEffect } from 'react'

export function useEscapeKey(active, onEscape) {
  useEffect(
    function listen() {
      if (!active) {
        return undefined
      }
      function handleKey(event) {
        if (event.key === 'Escape') {
          onEscape()
        }
      }
      document.addEventListener('keydown', handleKey)
      return function cleanup() {
        document.removeEventListener('keydown', handleKey)
      }
    },
    [active, onEscape],
  )
}
