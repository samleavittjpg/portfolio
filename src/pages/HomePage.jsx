import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { useFromIntro } from '../context/FromIntroContext.jsx'
import { CoverThumb } from '../components/CoverThumb.jsx'
import { ProjectDetailModal } from '../components/ProjectDetailModal.jsx'
import { apiUrl } from '../lib/apiBase.js'
import {
  SECTIONS,
  isVideoPath,
  projectCoverDisplayUrl,
  sectionForProject,
} from '../lib/sections.js'

/** Avg luminance of top band of cover (0-255). Above threshold -> dark text on hover. */
function useCoverTopBandIsLight(src, enabled) {
  const [isLight, setIsLight] = useState(null)

  useEffect(() => {
    if (!src) {
      setIsLight(null)
      return
    }
    if (!enabled) return

    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      try {
        const w = img.naturalWidth
        const h = img.naturalHeight
        if (!w || !h) {
          setIsLight(false)
          return
        }
        const canvas = document.createElement('canvas')
        const outW = Math.min(64, w)
        const bandSrcH = h * 0.26
        const outH = Math.max(6, Math.round(outW * (bandSrcH / w)))
        canvas.width = outW
        canvas.height = outH
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          setIsLight(false)
          return
        }
        ctx.drawImage(img, 0, 0, w, bandSrcH, 0, 0, outW, outH)
        const { data } = ctx.getImageData(0, 0, outW, outH)
        let sum = 0
        const n = data.length / 4
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        }
        const avg = sum / n
        setIsLight(avg > 138)
      } catch {
        setIsLight(false)
      }
    }
    img.onerror = () => {
      if (!cancelled) setIsLight(false)
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src, enabled])

  return isLight
}

const titleOnDarkBg = {
  color: '#ffffff',
  textShadow:
    '0 1px 3px rgba(0, 0, 0, 0.9), 0 0 22px rgba(0, 0, 0, 0.55)',
  transition: 'color 0.22s ease, text-shadow 0.22s ease',
}

const titleOnLightBg = {
  color: '#000000',
  textShadow:
    '0 1px 2px rgba(255, 255, 255, 0.65), 0 0 18px rgba(255, 255, 255, 0.4)',
  transition: 'color 0.22s ease, text-shadow 0.22s ease',
}

const ProjectCard = memo(function ProjectCard({ p, strip, onOpen }) {
  const cls = strip ? 'card home__sectionCard home__cardBtnWrap' : 'card home__cardBtnWrap'
  const coverUrl = projectCoverDisplayUrl(p)
  return (
    <li className={strip ? 'home__cardLi' : undefined}>
      <button
        type="button"
        className={cls}
        onClick={() => onOpen?.(p)}
        aria-label={`Open ${p.title}`}
      >
        {coverUrl ? (
          <CoverThumb url={coverUrl} className="thumb" lazy />
        ) : (
          <div className="thumb placeholder" aria-hidden />
        )}
        <div className="card-body">
          <h3>{p.title}</h3>
          <p className="summary">
            {p.summary?.trim() ? p.summary : '\u00A0'}
          </p>
          {strip ? <div className="card-body__stretch" aria-hidden /> : null}
          {p.tags?.length > 0 && (
            <ul className="tags">
              {p.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      </button>
    </li>
  )
})

function HomeSection({
  sectionKey,
  id,
  title,
  list,
  projectsLength,
  previewSrc,
  isFirstSection,
  onOpenProject,
}) {
  const [hovered, setHovered] = useState(false)
  const topBandLight = useCoverTopBandIsLight(
    previewSrc ?? null,
    hovered && !!previewSrc,
  )
  const scrollRef = useRef(null)
  const railRef = useRef(null)
  const trackRef = useRef(null)
  const [thumb, setThumb] = useState({ w: 100, l: 0, active: false })

  const titleStyle =
    previewSrc && hovered && topBandLight === true
      ? titleOnLightBg
      : titleOnDarkBg

  const updateThumb = useCallback(() => {
    const el = scrollRef.current
    if (!el || list.length === 0) {
      setThumb({ w: 100, l: 0, active: false })
      return
    }
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = scrollWidth - clientWidth
    if (maxScroll <= 1) {
      setThumb({ w: 100, l: 0, active: false })
      return
    }
    const w = (clientWidth / scrollWidth) * 100
    const l = (scrollLeft / maxScroll) * (100 - w)
    setThumb({ w, l, active: true })
  }, [list.length])

  useLayoutEffect(() => {
    updateThumb()
  }, [list, updateThumb])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateThumb()
    el.addEventListener('scroll', updateThumb, { passive: true })
    const ro = new ResizeObserver(updateThumb)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateThumb)
      ro.disconnect()
    }
  }, [updateThumb])

  const dragRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    const rail = railRef.current
    if (!el || !rail || list.length === 0) return

    const rowVerticalBand = () => {
      const items = rail.querySelectorAll(':scope > li')
      if (items.length === 0) return null
      let top = Infinity
      let bottom = -Infinity
      for (const li of items) {
        const r = li.getBoundingClientRect()
        top = Math.min(top, r.top)
        bottom = Math.max(bottom, r.bottom)
      }
      const pad = 12
      return { top: top - pad, bottom: bottom + pad }
    }

    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return

      const band = rowVerticalBand()
      if (!band) return
      const y = e.clientY
      if (y < band.top || y > band.bottom) return

      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [list.length])

  const onThumbPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!thumb.active) return
    const scroll = scrollRef.current
    const track = trackRef.current
    if (!scroll || !track) return
    const startX = e.clientX
    const startSl = scroll.scrollLeft
    const trackW = track.clientWidth
    const maxScroll = scroll.scrollWidth - scroll.clientWidth
    dragRef.current = { startX, startSl, trackW, maxScroll }

    const onMove = (ev) => {
      const d = dragRef.current
      if (!d) return
      const dx = ev.clientX - d.startX
      scroll.scrollLeft = Math.max(
        0,
        Math.min(d.maxScroll, d.startSl + (dx / d.trackW) * d.maxScroll),
      )
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const onTrackPointerDown = (e) => {
    if (e.button !== 0) return
    const scroll = scrollRef.current
    const track = trackRef.current
    if (!scroll || !track) return
    if (e.target.closest('.home__sectionDividerThumb')) return
    const maxScroll = scroll.scrollWidth - scroll.clientWidth
    if (maxScroll <= 0) return
    const rect = track.getBoundingClientRect()
    const x = e.clientX - rect.left
    const thumbFrac = scroll.clientWidth / scroll.scrollWidth
    const targetPct = Math.max(0, Math.min(1, x / rect.width))
    const next =
      ((targetPct - thumbFrac / 2) / Math.max(1e-6, 1 - thumbFrac)) * maxScroll
    scroll.scrollLeft = Math.max(0, Math.min(maxScroll, next))
  }

  return (
    <section
      className={`section section--${sectionKey} home__sectionShell${isFirstSection ? '' : ' home__sectionShell--follows'}${list.length > 0 ? ' home__sectionShell--hasStrip' : ''}`}
      aria-labelledby={id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="home__sectionInner home__narrow">
        <h2
          id={id}
          className="home__sectionTitle"
          style={titleStyle}
          data-title-shine={
            titleStyle === titleOnLightBg ? 'dark' : 'light'
          }
        >
          <Link
            to={`/home/section/${sectionKey}`}
            className="home__sectionTitleLink"
          >
            {title}
          </Link>
        </h2>
        {list.length === 0 ? (
          projectsLength > 0 ? (
            <p className="muted">No projects in this section yet.</p>
          ) : null
        ) : null}
      </div>
      {list.length > 0 ? (
        <>
          <div className="home__sectionStrip">
            {previewSrc ? (
              <div className="home__sectionHoverFill" aria-hidden>
                {isVideoPath(previewSrc) ? (
                  <video
                    src={previewSrc}
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img src={previewSrc} alt="" />
                )}
              </div>
            ) : null}
            <div className="home__sectionScroll" ref={scrollRef}>
              <div className="home__sectionRailAlign">
                <ul className="home__sectionRail" ref={railRef}>
                  {list.map((p) => (
                    <ProjectCard
                      key={p._id}
                      p={p}
                      strip
                      onOpen={onOpenProject}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div
            className="home__sectionDivider"
            ref={trackRef}
            onPointerDown={onTrackPointerDown}
          >
            <div
              className="home__sectionDividerThumb"
              style={{
                width: `${thumb.w}%`,
                left: `${thumb.l}%`,
                opacity: thumb.active ? 1 : 0.35,
              }}
              onPointerDown={onThumbPointerDown}
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(thumb.l)}
              aria-label={`Scroll ${title} horizontally`}
              onKeyDown={(ev) => {
                const el = scrollRef.current
                if (!el || !thumb.active) return
                const step = el.clientWidth * 0.2
                if (ev.key === 'ArrowLeft') {
                  ev.preventDefault()
                  el.scrollLeft -= step
                }
                if (ev.key === 'ArrowRight') {
                  ev.preventDefault()
                  el.scrollLeft += step
                }
              }}
            />
          </div>
        </>
      ) : (
        <div className="home__sectionDivider home__sectionDivider--inactive" />
      )}
    </section>
  )
}

export function HomePage() {
  const fromIntro = useFromIntro()
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState('loading')
  const [modalProject, setModalProject] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(apiUrl('/api/projects'), { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((data) => {
        if (!cancelled) {
          setProjects(data)
          setStatus('ok')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const bySection = useMemo(() => {
    const map = { dma: [], photography: [], personal: [] }
    for (const p of projects) {
      map[sectionForProject(p)].push(p)
    }
    return map
  }, [projects])

  return (
    <div className="home">
      <div
        className={
          fromIntro ? 'home__content home__content--fromIntro' : 'home__content'
        }
      >
        <header className="header home__narrow">
          <h1>Sam Leavitt</h1>
        </header>

        <main className="home__main">
          {status === 'loading' && (
            <div className="home__narrow">
              <p className="muted">Loading projects&hellip;</p>
            </div>
          )}
          {status === 'error' && (
            <div className="home__narrow">
              <p className="error">
                Could not reach the API. Start the server from{' '}
                <code>server/</code>, set <code>MONGODB_URI</code> in{' '}
                <code>server/.env</code>, then run <code>npm run dev</code> from
                the repo root.
              </p>
            </div>
          )}
          {status === 'ok' && projects.length === 0 && (
            <div className="home__narrow">
              <p className="muted">
                No projects yet. Seed samples:{' '}
                <code>npm run seed --prefix server</code>
              </p>
            </div>
          )}
          {status === 'ok' &&
            SECTIONS.map(({ key, id, title }, i) => {
              const list = bySection[key]
              const previewSrc =
                list.map(projectCoverDisplayUrl).find(Boolean) || undefined
              return (
                <HomeSection
                  key={key}
                  sectionKey={key}
                  id={id}
                  title={title}
                  list={list}
                  projectsLength={projects.length}
                  previewSrc={previewSrc}
                  isFirstSection={i === 0}
                  onOpenProject={setModalProject}
                />
              )
            })}
        </main>

        <footer className="footer home__narrow">
          <small>Vite + React &middot; Express + MongoDB</small>
        </footer>
      </div>

      <ProjectDetailModal
        project={modalProject}
        sectionProjects={
          modalProject
            ? bySection[sectionForProject(modalProject)]
            : undefined
        }
        onProjectChange={setModalProject}
        onClose={() => setModalProject(null)}
      />
    </div>
  )
}
