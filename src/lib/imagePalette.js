/**
 * Sample a raster image and build a conic-gradient matching dominant color shares
 * (approximate: angle maps to position around the frame; good visual match to “X% of the border”).
 */

function colorDistSq(a, b) {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const l = (max + min) / 2
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return { h, s, l }
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const t = (x) => {
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return {
    r: Math.round(t(h + 1 / 3) * 255),
    g: Math.round(t(h) * 255),
    b: Math.round(t(h - 1 / 3) * 255),
  }
}

/** Punch up chroma for a thin border on a near-black panel */
function punchBorderRgb(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b)
  const s2 = Math.min(1, s * 1.58 + (s > 0.02 ? 0.1 : 0))
  let l2 = l
  if (l2 < 0.22) l2 = Math.min(0.42, l2 + 0.14)
  else if (l2 < 0.38) l2 = Math.min(0.48, l2 + 0.06)
  if (l2 > 0.88) l2 = 0.82
  const out = hslToRgb(h, s2, l2)
  return {
    r: Math.max(0, Math.min(255, out.r)),
    g: Math.max(0, Math.min(255, out.g)),
    b: Math.max(0, Math.min(255, out.b)),
  }
}

/**
 * @param {string} src
 * @returns {Promise<string | null>} CSS conic-gradient() value
 */
export function getModalBorderGradientFromImage(src) {
  if (!src || typeof src !== 'string') return Promise.resolve(null)

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const done = (gradient) => resolve(gradient)

    img.onload = () => {
      const w = 56
      const h = 56
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        done(null)
        return
      }
      let imageData
      try {
        ctx.drawImage(img, 0, 0, w, h)
        imageData = ctx.getImageData(0, 0, w, h).data
      } catch {
        done(null)
        return
      }

      const buckets = new Map()
      for (let i = 0; i < imageData.length; i += 4) {
        const a = imageData[i + 3]
        if (a < 10) continue
        const r = (imageData[i] >> 4) << 4
        const g = (imageData[i + 1] >> 4) << 4
        const b = (imageData[i + 2] >> 4) << 4
        const key = `${r},${g},${b}`
        buckets.set(key, (buckets.get(key) || 0) + 1)
      }

      if (buckets.size === 0) {
        done(null)
        return
      }

      const entries = [...buckets.entries()]
        .map(([key, count]) => {
          const [r, g, b] = key.split(',').map(Number)
          return { r, g, b, count }
        })
        .sort((a, b) => b.count - a.count)

      const k = Math.min(4, entries.length)
      const centroids = entries.slice(0, k).map((e) => ({ r: e.r, g: e.g, b: e.b }))

      const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, w: 0 }))
      for (const e of entries) {
        let best = 0
        let bestD = Infinity
        for (let i = 0; i < centroids.length; i++) {
          const d = colorDistSq(e, centroids[i])
          if (d < bestD) {
            bestD = d
            best = i
          }
        }
        sums[best].r += e.r * e.count
        sums[best].g += e.g * e.count
        sums[best].b += e.b * e.count
        sums[best].w += e.count
      }

      const groups = sums
        .map((s) => {
          if (s.w <= 0) return null
          return {
            r: Math.round(s.r / s.w),
            g: Math.round(s.g / s.w),
            b: Math.round(s.b / s.w),
            w: s.w,
          }
        })
        .filter(Boolean)

      if (groups.length === 0) {
        done(null)
        return
      }

      const total = groups.reduce((acc, g) => acc + g.w, 0)
      if (total <= 0) {
        done(null)
        return
      }

      groups.sort((a, b) => b.w - a.w)

      let angle = 0
      const stops = []
      for (const g of groups) {
        const ratio = g.w / total
        const start = angle
        angle += ratio * 360
        const p = punchBorderRgb(g.r, g.g, g.b)
        const c = `rgb(${p.r},${p.g},${p.b})`
        stops.push(`${c} ${start}deg`, `${c} ${angle}deg`)
      }

      done(`conic-gradient(from -90deg at 50% 50%, ${stops.join(', ')})`)
    }

    img.onerror = () => done(null)
    img.src = src
  })
}
