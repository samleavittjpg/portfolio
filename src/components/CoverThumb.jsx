import { isVideoPath } from '../lib/sections.js'

/** Card cover: video URLs use a video element so .avi etc. are not loaded as images. */
export function CoverThumb({ url, className, lazy }) {
  if (!url) return null
  if (isVideoPath(url)) {
    return (
      <video
        className={className}
        src={url}
        muted
        playsInline
        preload="metadata"
        aria-hidden
      />
    )
  }
  return (
    <img
      src={url}
      alt=""
      className={className}
      loading={lazy ? 'lazy' : undefined}
    />
  )
}
