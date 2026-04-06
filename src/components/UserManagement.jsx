import { useState } from 'react'
import { useAuth } from '../context/useAuth.js'

/** @param {{ layout?: 'compact' | 'card' }} props */
export function UserManagement({ layout = 'compact' }) {
  const { user, logout } = useAuth()
  const [busy, setBusy] = useState(false)

  if (!user) return null

  const onLogout = () => {
    setBusy(true)
    void logout().finally(() => setBusy(false))
  }

  if (layout === 'card') {
    return (
      <div className="user-management user-management--card">
        <h2 className="user-management__title">Account</h2>
        <p className="user-management__line">
          Signed in as <strong>{user.username}</strong>
        </p>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onLogout}
          disabled={busy}
        >
          {busy ? 'Signing out…' : 'Log out'}
        </button>
      </div>
    )
  }

  return (
    <div className="user-management user-management--compact">
      <span className="user-management__name" title="Signed in">
        {user.username}
      </span>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={onLogout}
        disabled={busy}
      >
        {busy ? '…' : 'Log out'}
      </button>
    </div>
  )
}
