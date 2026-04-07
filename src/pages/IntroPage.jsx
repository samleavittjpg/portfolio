import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShaderCanvas } from '../components/ShaderCanvas.jsx'

export function IntroPage() {
  const navigate = useNavigate()
  const [greeted, setGreeted] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState('')
  const [snapBaseFilter, setSnapBaseFilter] = useState('')

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
    // Pause first, then snapshot on next frame so the overlay starts on the exact paused frame.
    requestAnimationFrame(() => {
      try {
        const canvas = document.querySelector('canvas.intro__shader')
        if (!canvas || typeof canvas.toDataURL !== 'function') return
        const cs = getComputedStyle(canvas)
        if (cs?.filter && cs.filter !== 'none') setSnapBaseFilter(cs.filter)
        const url = canvas.toDataURL('image/png')
        if (url) setSnapshotUrl(url)
      } catch {
        // ignore
      }
    })
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
      900,
    )
  }

  const label = greeted ? 'Entering…' : 'Click to enter'

  return (
    <div
      className={[
        'intro',
        overlayVisible ? 'intro--overlay' : '',
        leaving && snapshotUrl ? 'intro--circleLeaving' : '',
        leaving && !snapshotUrl ? 'intro--leaving' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ShaderCanvas
        className="intro__shader"
        preserveDrawingBuffer
        paused={leaving}
      />
      {snapshotUrl ? (
        <div className="intro__circleOverlay" aria-hidden="true">
          <img
            className="intro__shaderSnapshot"
            src={snapshotUrl}
            alt=""
            style={
              snapBaseFilter
                ? { '--intro-snap-base-filter': snapBaseFilter }
                : undefined
            }
          />
          <div className="intro__shaderSnapshotDarken" aria-hidden="true" />
        </div>
      ) : null}
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

