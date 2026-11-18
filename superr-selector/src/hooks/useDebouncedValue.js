import { useEffect, useState } from 'react'

export function useDebouncedValue(value, delayMs = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(
    function schedule() {
      const timer = setTimeout(function apply() {
        setDebounced(value)
      }, delayMs)
      return function cancel() {
        clearTimeout(timer)
      }
    },
    [value, delayMs],
  )
  return debounced
}
