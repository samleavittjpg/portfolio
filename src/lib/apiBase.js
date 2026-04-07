/**
 * Split deploy: set VITE_API_BASE_URL=https://your-service.onrender.com (no trailing slash).
 * Leave unset for local dev (Vite proxies /api and /uploads to the API).
 */
const raw = import.meta.env.VITE_API_BASE_URL

export const API_BASE =
  typeof raw === 'string' && raw.trim() ? raw.trim().replace(/\/$/, '') : ''

/**
 * @param {string} path e.g. `/api/projects`
 */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return API_BASE ? `${API_BASE}${p}` : p
}
