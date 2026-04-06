import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

const FromIntroContext = createContext(false)

export function FromIntroProvider({ children }) {
  const location = useLocation()
  const [fromIntro, setFromIntro] = useState(false)

  /* useState(loader) often misses `location.state` on first paint; layout runs after router applies it */
  useLayoutEffect(() => {
    const fromState = location.state?.fromIntro === true
    let fromStorage = false
    try {
      fromStorage = sessionStorage.getItem('portfolioFromIntro') === '1'
    } catch {
      // ignore
    }
    if (fromState || fromStorage) setFromIntro(true)
  }, [location.pathname, location.state])

  useEffect(() => {
    if (!fromIntro) return
    const t = window.setTimeout(() => {
      try {
        sessionStorage.removeItem('portfolioFromIntro')
      } catch {
        // ignore
      }
    }, 3000)
    return () => window.clearTimeout(t)
  }, [fromIntro])

  const value = useMemo(() => fromIntro, [fromIntro])
  return (
    <FromIntroContext.Provider value={value}>
      {children}
    </FromIntroContext.Provider>
  )
}

export function useFromIntro() {
  return useContext(FromIntroContext)
}
