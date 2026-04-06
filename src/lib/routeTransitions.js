/** Order for horizontal section-page slides (photography in the middle). */
const SECTION_ORDER = { dma: 0, photography: 1, personal: 2 }

function normalizePath(p) {
  if (!p || typeof p !== 'string') return ''
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}

const SECTION_RE = /^\/home\/section\/([a-z]+)$/

function sectionKeyFromPath(p) {
  const m = normalizePath(p).match(SECTION_RE)
  return m ? m[1] : null
}

function isHomePath(p) {
  const n = normalizePath(p)
  return n === '/home' || n === ''
}

/**
 * Which enter animation to run (Web Animations API in ShellLayout).
 * @param {string} fromPath
 * @param {string} toPath
 * @returns {'circle' | 'slideRight' | 'slideLeft' | 'fade' | null}
 */
export function getOutletTransitionKind(fromPath, toPath) {
  if (typeof fromPath !== 'string' || typeof toPath !== 'string') return null
  const from = normalizePath(fromPath)
  const to = normalizePath(toPath)
  if (!from || !to || from === to) return null

  const fromSec = sectionKeyFromPath(from)
  const toSec = sectionKeyFromPath(to)

  if (isHomePath(from) && toSec) return 'circle'
  if (fromSec && isHomePath(to)) return 'circle'
  if (fromSec && toSec && fromSec !== toSec) {
    const iFrom = SECTION_ORDER[fromSec] ?? 0
    const iTo = SECTION_ORDER[toSec] ?? 0
    if (iTo > iFrom) return 'slideRight'
    if (iTo < iFrom) return 'slideLeft'
  }

  return 'fade'
}
