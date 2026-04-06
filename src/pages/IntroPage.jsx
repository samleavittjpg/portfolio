import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShaderCanvas } from '../components/ShaderCanvas.jsx'

export function IntroPage() {
  const navigate = useNavigate()
  const [greeted, setGreeted] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setOverlayVisible(true), 1500)
    return () => window.clearTimeout(t)
  }, [])

  const onEnter = () => {
    if (leaving) return
    try {
      localStorage.setItem('introSeen', '1')
    } catch {
      // ignore
    }
    setGreeted(true)
    setLeaving(true)
    try {
      sessionStorage.setItem('portfolioFromIntro', '1')
    } catch {
      // ignore
    }
    window.setTimeout(
      () =>
        navigate('/home', {
          replace: true,
          state: { fromIntro: true },
        }),
      800,
    )
  }

  const label = greeted ? 'Entering…' : 'Click to enter'

  return (
    <div
      className={[
        'intro',
        overlayVisible ? 'intro--overlay' : '',
        leaving ? 'intro--leaving' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ShaderCanvas className="intro__shader" />
      <button
        type="button"
        className={overlayVisible ? 'intro__click is-visible' : 'intro__click'}
        onClick={onEnter}
        aria-label="Enter portfolio"
      >
        <span className="intro__clickLabel">
          {label.split('').map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className="intro__clickChar"
              style={{ '--i': i }}
              aria-hidden="true"
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
          <span className="sr-only">{label}</span>
        </span>
      </button>
    </div>
  )
}

