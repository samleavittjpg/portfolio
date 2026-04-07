import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CoverThumb } from '../components/CoverThumb.jsx'
import { ProjectDetailModal } from '../components/ProjectDetailModal.jsx'
import { apiUrl } from '../lib/apiBase.js'
import {
  dmaSubsectionForProject,
  getSectionMeta,
  groupDmaProjectsBySubsection,
  projectCoverDisplayUrl,
  sectionForProject,
} from '../lib/sections.js'

function GridCard({ project, onOpen }) {
  const coverUrl = projectCoverDisplayUrl(project)
  return (
    <li className="sectionGrid__cell">
      <button
        type="button"
        className="sectionGrid__card"
        onClick={() => onOpen(project)}
        aria-label={`Open ${project.title}`}
      >
        {coverUrl ? (
          <CoverThumb url={coverUrl} className="sectionGrid__thumb" lazy />
        ) : (
          <div className="sectionGrid__thumb sectionGrid__thumb--empty" aria-hidden />
        )}
        <span className="sectionGrid__label">{project.title}</span>
      </button>
    </li>
  )
}

export function SectionPage() {
  const { sectionKey } = useParams()
  const meta = getSectionMeta(sectionKey)
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

  const list = useMemo(() => {
    if (!meta) return []
    return projects.filter((p) => sectionForProject(p) === meta.key)
  }, [projects, meta])

  const dmaGroups = useMemo(
    () => (meta?.key === 'dma' ? groupDmaProjectsBySubsection(list) : []),
    [meta?.key, list]
  )

  /** DMA modal prev/next stays within the same subsection bucket (see DMA_SUBSECTION_ORDER). */
  const modalSectionProjects = useMemo(() => {
    if (!meta || meta.key !== 'dma' || !modalProject) return list
    const sub = dmaSubsectionForProject(modalProject)
    return list.filter((p) => dmaSubsectionForProject(p) === sub)
  }, [meta, modalProject, list])

  if (!meta) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className={`sectionPage sectionPage--${meta.key}`}>
      <div className="sectionPage__inner home__narrow">
        <p className="sectionPage__back">
          <Link to="/home">&larr; Back to home</Link>
        </p>
        <header className="sectionPage__header">
          <h1 className="sectionPage__title">
            {meta.title}
          </h1>
        </header>

        {status === 'loading' && (
          <p className="muted">Loading&hellip;</p>
        )}
        {status === 'error' && (
          <p className="error">Could not load projects.</p>
        )}
        {status === 'ok' && list.length === 0 && (
          <p className="muted">No items in this section yet.</p>
        )}
        {status === 'ok' && list.length > 0 && meta.key !== 'dma' && (
          <ul className="sectionGrid">
            {list.map((p) => (
              <GridCard key={p._id} project={p} onOpen={setModalProject} />
            ))}
          </ul>
        )}
        {status === 'ok' && list.length > 0 && meta.key === 'dma' && (
          <div className="sectionPage__dmaGroups">
            {dmaGroups.map((g) => (
              <section
                key={g.key}
                className="sectionPage__group"
                aria-labelledby={`dma-sub-${g.key}`}
              >
                <h2 id={`dma-sub-${g.key}`} className="sectionPage__subheading">
                  {g.label}
                </h2>
                <ul className="sectionGrid">
                  {g.projects.map((p) => (
                    <GridCard key={p._id} project={p} onOpen={setModalProject} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <ProjectDetailModal
        project={modalProject}
        sectionProjects={modalSectionProjects}
        onProjectChange={setModalProject}
        onClose={() => setModalProject(null)}
      />
    </div>
  )
}
