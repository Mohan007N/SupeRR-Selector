import { useState } from 'react'

// useState that remembers its value. Storage can be blocked, so every access is guarded.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(function readInitial() {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) {
        return JSON.parse(stored)
      }
    } catch (error) {
      // Ignore: fall back to the default.
    }
    return initialValue
  })

  function update(next) {
    setValue(next)
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch (error) {
      // Ignore: the value just will not persist.
    }
  }

  return [value, update]
}
