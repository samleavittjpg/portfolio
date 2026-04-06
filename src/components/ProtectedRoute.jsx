import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="site">
        <p className="muted" style={{ padding: '2rem 1.5rem' }}>
          Checking session…
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/home" replace state={{ from: location.pathname }} />
  }

  return children
}
