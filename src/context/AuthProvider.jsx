import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiJson } from '../api/client'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await apiJson('/api/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (username, password) => {
    const data = await apiJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    await apiJson('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
