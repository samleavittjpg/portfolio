import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { FromIntroProvider } from '../context/FromIntroContext.jsx'
import { useAuth } from '../context/useAuth.js'
import { getOutletTransitionKind } from '../lib/routeTransitions.js'
import { ShaderCanvas } from './ShaderCanvas.jsx'
import { UserManagement } from './UserManagement'
import { SECTIONS } from '../lib/sections.js'

const PARTS_MENU_LABEL = {
  dma: 'DMA',
  photography: 'Photography',
  personal: 'Personal',
}

const CIRCLE_MS = 560
const CIRCLE_EASE = 'cubic-bezier(0.22, 1, 0.32, 1)'
const SLIDE_MS = 400
const SLIDE_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)'
const FADE_MS = 280

function runOutletEnterAnimation(el, kind) {
  if (!kind) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    el.style.clipPath = ''
    el.style.webkitClipPath = ''
    el.style.transform = ''
    el.style.opacity = ''
    return
  }

  el.getAnimations?.().forEach((a) => a.cancel())
  el.style.clipPath = ''
  el.style.webkitClipPath = ''
  el.style.transform = ''
  el.style.opacity = ''

  if (kind === 'circle') {
    /* 0% radius is unreliable in some engines; 0px + vmax expansion matches CSS iris */
    const anim = el.animate(
      [
        {
          clipPath: 'circle(0px at 50% 50%)',
          WebkitClipPath: 'circle(0px at 50% 50%)',
        },
        {
          clipPath: 'circle(150vmax at 50% 50%)',
          WebkitClipPath: 'circle(150vmax at 50% 50%)',
          offset: 0.92,
        },
        {
          clipPath: 'inset(0)',
          WebkitClipPath: 'inset(0)',
        },
      ],
      { duration: CIRCLE_MS, easing: CIRCLE_EASE, fill: 'forwards' },
    )
    anim.finished.finally(() => {
      el.style.clipPath = ''
      el.style.webkitClipPath = ''
    })
    return
  }

  if (kind === 'slideRight') {
    el.animate(
      [{ transform: 'translate3d(14px, 0, 0)' }, { transform: 'translate3d(0, 0, 0)' }],
      { duration: SLIDE_MS, easing: SLIDE_EASE, fill: 'forwards' },
    )
    return
  }

  if (kind === 'slideLeft') {
    el.animate(
      [{ transform: 'translate3d(-14px, 0, 0)' }, { transform: 'translate3d(0, 0, 0)' }],
      { duration: SLIDE_MS, easing: SLIDE_EASE, fill: 'forwards' },
    )
    return
  }

  el.animate(
    [{ opacity: 0.94 }, { opacity: 1 }],
    { duration: FADE_MS, easing: SLIDE_EASE, fill: 'forwards' },
  )
}

function ShellLayoutBody() {
  const { user } = useAuth()
  const location = useLocation()
  const partsDetailsRef = useRef(null)
  const outletAnimRef = useRef(null)
  const prevPathForAnimRef = useRef(location.pathname)

  useLayoutEffect(() => {
    const from = prevPathForAnimRef.current
    const to = location.pathname
    if (from === to) return
    const kind = getOutletTransitionKind(from, to)
    prevPathForAnimRef.current = to
    const el = outletAnimRef.current
    if (!el) return
    requestAnimationFrame(() => {
      const node = outletAnimRef.current
      if (node) runOutletEnterAnimation(node, kind)
    })
  }, [location.pathname])

  useEffect(() => {
    partsDetailsRef.current?.removeAttribute('open')
  }, [location.pathname])

  return (
    <div className="site site--shader">
      <div className="portfolioBackdrop" aria-hidden>
        <div className="portfolioBackdrop__shaderWrap">
          <ShaderCanvas className="portfolioBackdrop__shader" />
        </div>
      </div>
      <div className="portfolioBackdrop__veil" aria-hidden />
      <div className="site__body">
        <div className="top-bar">
          <nav className="top-nav" aria-label="Primary">
            <Link to="/home" className="top-nav__brand">
              Home
            </Link>
            <div className="top-nav__links">
              <details
                ref={partsDetailsRef}
                className="top-nav__dropdown"
              >
                <summary className="top-nav__dropdownBtn">Parts</summary>
                <ul className="top-nav__dropdownMenu" role="list">
                  {SECTIONS.map((s) => (
                    <li key={s.key}>
                      <Link to={`/home/section/${s.key}`}>
                        {PARTS_MENU_LABEL[s.key]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
              <Link to="/about">About</Link>
              {user && <Link to="/dashboard">Dashboard</Link>}
            </div>
          </nav>
          {user && <UserManagement layout="compact" />}
        </div>
        <div className="site__outletAnim">
          <div ref={outletAnimRef} className="site__outletAnimInner">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShellLayout() {
  return (
    <FromIntroProvider>
      <ShellLayoutBody />
    </FromIntroProvider>
  )
}
