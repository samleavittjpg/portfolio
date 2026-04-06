export const SECTIONS = [
  { key: 'dma', id: 'section-dma', title: 'DMA portfolio review' },
  { key: 'photography', id: 'section-photography', title: 'Photography' },
  { key: 'personal', id: 'section-personal', title: 'Personal Work' },
]

export function sectionForProject(p) {
  const s = p.section
  if (s === 'photography' || s === 'personal') return s
  return 'dma'
}

export function getSectionMeta(key) {
  return SECTIONS.find((s) => s.key === key) ?? null
}

/** Keys for /home/section/dma layout (fixed order). Illustration merges into vector. */
export const DMA_SUBSECTION_ORDER = [
  'glitch',
  'vector',
  'video',
  'other',
]

export const DMA_SUBSECTION_LABELS = {
  glitch: 'Glitch',
  vector: 'Vector / Illustration',
  video: 'Video',
  other: 'Other',
}

const DMA_CATEGORY_SLUGS = new Set([
  'glitch',
  'vector',
  'video',
  'illustration',
])

/**
 * Bucket for DMA section page: explicit `dmaCategory`, else a matching tag, else `other`.
 * `illustration` (category or tag) is grouped with `vector` as one subsection.
 * @param {{ dmaCategory?: string, tags?: string[] } | null | undefined} p
 */
export function dmaSubsectionForProject(p) {
  if (!p) return 'other'
  const raw = p.dmaCategory != null ? String(p.dmaCategory).trim().toLowerCase() : ''
  let key = 'other'
  if (raw && DMA_CATEGORY_SLUGS.has(raw)) {
    key = raw
  } else {
    const tags = Array.isArray(p.tags) ? p.tags : []
    for (const k of ['glitch', 'vector', 'video', 'illustration']) {
      if (tags.some((t) => String(t ?? '').trim().toLowerCase() === k)) {
        key = k
        break
      }
    }
  }
  return key === 'illustration' ? 'vector' : key
}

/**
 * @param {Array<{ dmaCategory?: string, tags?: string[], sortOrder?: number, createdAt?: string }>} projects
 * @returns {Array<{ key: string, label: string, projects: typeof projects }>}
 */
export function groupDmaProjectsBySubsection(projects) {
  const buckets = {
    glitch: [],
    vector: [],
    video: [],
    other: [],
  }
  for (const p of projects) {
    const k = dmaSubsectionForProject(p)
    buckets[k].push(p)
  }
  return DMA_SUBSECTION_ORDER.filter((k) => buckets[k].length > 0).map((key) => ({
    key,
    label: DMA_SUBSECTION_LABELS[key],
    projects: buckets[key],
  }))
}

/**
 * Paths from Mongo are often stored as `uploads/...` without a leading `/`.
 * Relative URLs then resolve against the current route (e.g. /home/uploads/…)
 * and break; the same string works when typed in the address bar from site root.
 */
export function normalizeUploadedAssetUrl(path) {
  if (!path || typeof path !== 'string') return ''
  const s = path.trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s) || s.startsWith('//') || s.startsWith('data:')) {
    return s
  }
  if (s.startsWith('/')) return s
  return `/${s.replace(/^\/+/, '')}`
}

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v|avi)(\?.*)?$/i

export function isVideoPath(path) {
  if (!path || typeof path !== 'string') return false
  return VIDEO_EXT.test(path)
}

const YT_ID = /^[\w-]{11}$/

/**
 * @param {string | undefined | null} input
 * @returns {string | null} 11-char video id or null
 */
export function parseYoutubeVideoId(input) {
  if (!input || typeof input !== 'string') return null
  const s = input.trim()
  if (!s) return null
  if (YT_ID.test(s)) return s
  try {
    const u = new URL(s, 'https://www.youtube.com')
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id && YT_ID.test(id) ? id : null
    }
    if (!host.endsWith('youtube.com')) return null
    if (u.pathname.startsWith('/embed/')) {
      const id = u.pathname.slice(7).split('/')[0]
      return id && YT_ID.test(id) ? id : null
    }
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.slice(8).split('/')[0]
      return id && YT_ID.test(id) ? id : null
    }
    const v = u.searchParams.get('v')
    return v && YT_ID.test(v) ? v : null
  } catch {
    return null
  }
}

/** Poster image URL for cards / hover (hqdefault is reliably present). */
export function youtubeThumbnailUrl(videoId) {
  if (!videoId || !YT_ID.test(videoId)) return ''
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

/**
 * Image URL for grid cards and section hover: uploaded cover wins, else YouTube poster.
 * @param {{ coverAssetPath?: string, youtubeUrl?: string } | null | undefined} project
 */
export function projectCoverDisplayUrl(project) {
  if (!project) return ''
  const cover = project.coverAssetPath && String(project.coverAssetPath).trim()
  if (cover) return normalizeUploadedAssetUrl(cover)
  const id = parseYoutubeVideoId(project.youtubeUrl)
  return id ? youtubeThumbnailUrl(id) : ''
}

/** Prefer optional pieceDate string; else createdAt from API */
export function formatPieceDate(project) {
  if (project.pieceDate && String(project.pieceDate).trim()) {
    return String(project.pieceDate).trim()
  }
  if (project.createdAt) {
    const d = new Date(project.createdAt)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }
  }
  return ''
}
