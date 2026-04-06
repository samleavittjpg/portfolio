import { useEffect, useRef, useState } from 'react'

import handCursorWebp from '../assets/790c78d39fd853ae72167411aa11d727-pixilated-hand-cursor-1.webp'

/** Served from `vite-portfolio/public/cursor.png` (no import — avoids broken bundle if the file moves). */
const CURSOR_PNG =
  `${import.meta.env.BASE_URL}cursor.png`.replace(/\/{2,}/g, '/')

/**
 * Hotspots = pixel offset from the img’s top-left to the “click tip” (must match each asset).
 * Arrow PNG has empty margin above/left of the tip; hand WebP has the fingertip below the top-left corner.
 */
const ARROW_HOTSPOT = { x: 6, y: 4 }
const HAND_HOTSPOT = { x: 10, y: 2 }

/** Six spawn offsets around the click (px from center) — each particle picks one at random */
const SPAWN_RING_R = 24
const SPAWN_PRESETS = [0, 1, 2, 3, 4, 5].map((k) => {
  const a = (k * Math.PI) / 3
  return {
    sx: Math.cos(a) * SPAWN_RING_R,
    sy: Math.sin(a) * SPAWN_RING_R,
  }
})

const PLUS_ARMS = ['20px', '13px', '17px']

function generateBurstParticles() {
  const particles = []
  for (let i = 0; i < 3; i++) {
    const pick = Math.floor(Math.random() * 6)
    const { sx, sy } = SPAWN_PRESETS[pick]
    const len = Math.hypot(sx, sy) || 1
    const ux = sx / len
    const uy = sy / len
    const extra = 30 + Math.random() * 14
    const ex = sx + ux * extra
    const ey = sy + uy * extra
    particles.push({
      arm: PLUS_ARMS[i],
      sx: `${sx.toFixed(2)}px`,
      sy: `${sy.toFixed(2)}px`,
      ex: `${ex.toFixed(2)}px`,
      ey: `${ey.toFixed(2)}px`,
      delay: i * 28,
    })
  }
  return particles
}

function SparkleBurst({ x, y, particles, id, onDone }) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const t = window.setTimeout(() => doneRef.current(), 640)
    return () => window.clearTimeout(t)
  }, [id])

  return (
    <div
      className="pointerFx__burst"
      style={{ left: x, top: y }}
      aria-hidden
    >
      {particles.map((p, i) => (
        <span
          key={`${id}-${i}`}
          className="pointerFx__drift"
          style={{
            '--sx': p.sx,
            '--sy': p.sy,
            '--ex': p.ex,
            '--ey': p.ey,
            animationDelay: `${p.delay}ms`,
          }}
        >
          <span className="pointerFx__plus" style={{ '--arm': p.arm }}>
            <span className="pointerFx__plusBar pointerFx__plusBar--h" />
            <span className="pointerFx__plusBar pointerFx__plusBar--v" />
          </span>
        </span>
      ))}
    </div>
  )
}

function isTextLikeTarget(el) {
  if (!el || typeof el.closest !== 'function') return false
  return !!el.closest(
    'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="image"]), textarea, [contenteditable="true"]',
  )
}

function isPointerTarget(el) {
  if (!el || typeof el.closest !== 'function') return false
  if (isTextLikeTarget(el)) return false
  return !!el.closest(
    [
      'a[href]',
      'button:not([disabled])',
      '[role="button"]:not([aria-disabled="true"])',
      'input[type="submit"]',
      'input[type="button"]',
      'input[type="reset"]',
      'input[type="checkbox"]',
      'input[type="radio"]',
      'label',
      'select',
      'summary',
      '.home__cardBtnWrap',
      '.home__sectionDivider:not(.home__sectionDivider--inactive)',
      '.home__sectionDividerThumb',
      '.home__sectionTitleLink',
      '.sectionGrid__card',
      '.projectModal__close',
      '.projectModal__navBtn',
    ].join(','),
  )
}

export function PointerEffects() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [finePointer, setFinePointer] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [textLike, setTextLike] = useState(false)
  const [handMode, setHandMode] = useState(false)
  const [bursts, setBursts] = useState([])
  const rafRef = useRef(0)
  const pendingRef = useRef(null)
  const burstSeq = useRef(0)

  useEffect(() => {
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement

    const syncFxClass = () => {
      const on = mqFine.matches && !mqReduce.matches
      root.classList.toggle('pointerFx--on', on)
    }

    const onFineChange = () => {
      setFinePointer(mqFine.matches)
      syncFxClass()
    }
    const onReduceChange = () => {
      setReduceMotion(mqReduce.matches)
      syncFxClass()
    }

    setFinePointer(mqFine.matches)
    setReduceMotion(mqReduce.matches)
    syncFxClass()

    mqFine.addEventListener('change', onFineChange)
    mqReduce.addEventListener('change', onReduceChange)

    const flushMove = () => {
      rafRef.current = 0
      const p = pendingRef.current
      if (p) {
        setPos({ x: p.x, y: p.y })
        const tl = isTextLikeTarget(p.target)
        setTextLike(tl)
        setHandMode(!tl && isPointerTarget(p.target))
      }
    }

    const onMove = (e) => {
      pendingRef.current = { x: e.clientX, y: e.clientY, target: e.target }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flushMove)
      }
    }

    const onClick = (e) => {
      if (mqReduce.matches) return
      if (e.button !== 0) return
      const id = ++burstSeq.current
      setBursts((b) => [
        ...b,
        {
          id,
          x: e.clientX,
          y: e.clientY,
          particles: generateBurstParticles(),
        },
      ])
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('click', onClick, true)

    return () => {
      mqFine.removeEventListener('change', onFineChange)
      mqReduce.removeEventListener('change', onReduceChange)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', onClick, true)
      root.classList.remove('pointerFx--on')
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (reduceMotion) setBursts([])
  }, [reduceMotion])

  const showCursor = finePointer && !reduceMotion && !textLike
  const hotspot = handMode ? HAND_HOTSPOT : ARROW_HOTSPOT

  const removeBurst = (id) => {
    setBursts((b) => b.filter((x) => x.id !== id))
  }

  return (
    <>
      {showCursor ? (
        <div
          className="pointerFx__cursor"
          style={{
            transform: `translate(${pos.x - hotspot.x}px, ${pos.y - hotspot.y}px)`,
          }}
          aria-hidden
        >
          <img
            src={handMode ? handCursorWebp : CURSOR_PNG}
            alt=""
            className={
              handMode
                ? 'pointerFx__cursorImg pointerFx__cursorImg--hand'
                : 'pointerFx__cursorImg pointerFx__cursorImg--arrow'
            }
            draggable={false}
          />
        </div>
      ) : null}
      {!reduceMotion &&
        bursts.map((b) => (
          <SparkleBurst
            key={b.id}
            id={b.id}
            x={b.x}
            y={b.y}
            particles={b.particles}
            onDone={() => removeBurst(b.id)}
          />
        ))}
    </>
  )
}
