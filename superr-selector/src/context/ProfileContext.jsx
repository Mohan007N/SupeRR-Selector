import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ProfileDrawer from '../components/profile/ProfileDrawer.jsx'

const ProfileContext = createContext(null)

// Any component can call openProfile('batting' | 'bowling', playerId) to show the profile drawer.
export function ProfileProvider({ children }) {
  const [target, setTarget] = useState(null)

  const openProfile = useCallback(function open(type, id) {
    setTarget({ type: type, id: id })
  }, [])
  const closeProfile = useCallback(function close() {
    setTarget(null)
  }, [])

  const value = useMemo(
    function build() {
      return { openProfile: openProfile, closeProfile: closeProfile, target: target }
    },
    [openProfile, closeProfile, target],
  )

  return (
    <ProfileContext.Provider value={value}>
      {children}
      <ProfileDrawer target={target} onClose={closeProfile} />
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const value = useContext(ProfileContext)
  if (value === null) {
    throw new Error('useProfile must be used inside ProfileProvider')
  }
  return value
}
