import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getModalBorderGradientFromImage } from '../lib/imagePalette.js'
import {
  formatPieceDate,
  isVideoPath,
  normalizeUploadedAssetUrl,
  parseYoutubeVideoId,
  youtubeThumbnailUrl,
} from '../lib/sections.js'

function projectIndexInSection(project, sectionProjects) {
  if (!project || !sectionProjects?.length) return -1
  const id = String(project._id ?? '')
  return sectionProjects.findIndex((p) => String(p._id ?? '') === id)
}

export function ProjectDetailModal({
  project,
  onClose,
  sectionProjects,
  onProjectChange,
}) {
  const closeRef = useRef(null)
  const hadProjectRef = useRef(false)
  const [borderGradient, setBorderGradient] = useState(null)
  const [videoPlaybackFailed, setVideoPlaybackFailed] = useState(false)

  const { index, hasPrev, hasNext } = useMemo(() => {
    const i = projectIndexInSection(project, sectionProjects)
    const n = sectionProjects?.length ?? 0
    if (i < 0 || n < 2) {
      return { index: -1, hasPrev: false, hasNext: false }
    }
    return {
      index: i,
      hasPrev: i > 0,
      hasNext: i < n - 1,
    }
  }, [project, sectionProjects])

  const goPrev = useCallback(() => {
    if (!onProjectChange || index <= 0 || !sectionProjects?.length) return
    onProjectChange(sectionProjects[index - 1])
  }, [index, onProjectChange, sectionProjects])

  const goNext = useCallback(() => {
    if (!onProjectChange || index < 0 || !sectionProjects?.length) return
    if (index >= sectionProjects.length - 1) return
    onProjectChange(sectionProjects[index + 1])
  }, [index, onProjectChange, sectionProjects])

  useEffect(() => {
    if (!project) {
      hadProjectRef.current = false
      return
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (!sectionProjects?.length || !onProjectChange) return
      const i = projectIndexInSection(project, sectionProjects)
      if (i < 0) return
      const active = document.activeElement
      if (active && active.tagName === 'VIDEO') return
      if (active && active.tagName === 'IFRAME') return
      if (e.key === 'ArrowLeft' && i > 0) {
        e.preventDefault()
        onProjectChange(sectionProjects[i - 1])
      } else if (e.key === 'ArrowRight' && i < sectionProjects.length - 1) {
        e.preventDefault()
        onProjectChange(sectionProjects[i + 1])
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!hadProjectRef.current) {
      hadProjectRef.current = true
      closeRef.current?.focus()
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [project, onClose, sectionProjects, onProjectChange])

  const src = project
    ? normalizeUploadedAssetUrl(project.coverAssetPath || '')
    : ''
  const youtubeIdEarly = project ? parseYoutubeVideoId(project.youtubeUrl) : null
  const videoEarly = src ? isVideoPath(src) : false

  useEffect(() => {
    setVideoPlaybackFailed(false)
  }, [project?._id, src])

  const paletteImageSrc = useMemo(() => {
    if (!project) return ''
    if (youtubeIdEarly) return youtubeThumbnailUrl(youtubeIdEarly)
    if (src && !videoEarly) return src
    return ''
  }, [project, youtubeIdEarly, src, videoEarly])

  useEffect(() => {
    if (!paletteImageSrc) {
      setBorderGradient(null)
      return
    }
    setBorderGradient(null)
    let cancelled = false
    getModalBorderGradientFromImage(paletteImageSrc).then((g) => {
      if (!cancelled) setBorderGradient(g)
    })
    return () => {
      cancelled = true
    }
  }, [paletteImageSrc])

  if (!project) return null

  const desc =
    (project.description && String(project.description).trim()) ||
    (project.summary && String(project.summary).trim()) ||
    ''
  const dateStr = formatPieceDate(project)
  const video = isVideoPath(src)
  const youtubeId = parseYoutubeVideoId(project.youtubeUrl)
  const embedSrc = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`
    : ''

  return createPortal(
    <div
      className="projectModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="projectModal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`projectModal__panel${borderGradient ? ' projectModal__panel--chromatic' : ''}`}
        style={
          borderGradient
            ? { '--modal-border-gradient': borderGradient }
            : undefined
        }
      >
        <button
          ref={closeRef}
          type="button"
          className="projectModal__close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="projectModal__panelScroll">
          <div className="projectModal__body">
            <div className="projectModal__media">
            {hasPrev ? (
              <button
                type="button"
                className="projectModal__navBtn projectModal__navBtn--prev"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                aria-label="Previous project in section"
              >
                <span
                  className="projectModal__navTri projectModal__navTri--prev"
                  aria-hidden
                />
              </button>
            ) : null}
            {hasNext ? (
              <button
                type="button"
                className="projectModal__navBtn projectModal__navBtn--next"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                aria-label="Next project in section"
              >
                <span
                  className="projectModal__navTri projectModal__navTri--next"
                  aria-hidden
                />
              </button>
            ) : null}
            {youtubeId ? (
              <iframe
                key={`${project._id ?? 'p'}-${youtubeId}`}
                className="projectModal__iframe"
                src={embedSrc}
                title={`${project.title} — video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : src ? (
              video ? (
                videoPlaybackFailed ? (
                  <div className="projectModal__mediaFallback">
                    <p className="projectModal__mediaFallbackText">
                      This browser cannot play this file inline (common for AVI).
                    </p>
                    <a
                      className="projectModal__mediaFallbackLink"
                      href={src}
                      download
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download video
                    </a>
                  </div>
                ) : (
                  <video
                    key={src}
                    className="projectModal__video"
                    src={src}
                    controls
                    playsInline
                    onError={() => setVideoPlaybackFailed(true)}
                  />
                )
              ) : (
                <img
                  className="projectModal__img"
                  src={src}
                  alt=""
                />
              )
            ) : (
              <div className="projectModal__placeholder" aria-hidden />
            )}
            </div>
            <div className="projectModal__meta">
              <h2 id="projectModal-title" className="projectModal__title">
                {project.title}
              </h2>
              {dateStr ? (
                <p className="projectModal__date">{dateStr}</p>
              ) : null}
              {desc ? (
                <p className="projectModal__desc">{desc}</p>
              ) : (
                <p className="projectModal__desc projectModal__desc--empty">
                  No description yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
