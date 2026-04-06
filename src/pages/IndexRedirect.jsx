import { Navigate } from 'react-router-dom'

export function IndexRedirect() {
  let seen = false
  try {
    seen = localStorage.getItem('introSeen') === '1'
  } catch {
    seen = false
  }

  return <Navigate to={seen ? '/home' : '/intro'} replace />
}

