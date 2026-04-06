import { useEffect, useRef } from 'react'

function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Could not create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const msg = gl.getShaderInfoLog(shader) || 'Shader compile failed'
    gl.deleteShader(shader)
    throw new Error(msg)
  }
  return shader
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)

  const program = gl.createProgram()
  if (!program) throw new Error('Could not create program')
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  gl.deleteShader(vs)
  gl.deleteShader(fs)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const msg = gl.getProgramInfoLog(program) || 'Program link failed'
    gl.deleteProgram(program)
    throw new Error(msg)
  }

  return program
}

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

  for (int i = 1; i < 10; i++) {
    float fi = float(i);
    uv.x += 0.6 / fi * cos(fi * 2.5 * uv.y + iTime);
    uv.y += 0.6 / fi * cos(fi * 1.5 * uv.x + iTime);
  }

  fragColor = vec4(vec3(0.1) / abs(sin(iTime - uv.y - uv.x)), 1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`

export function ShaderCanvas({ className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      canvas.getContext('webgl', { antialias: false, alpha: true }) ||
      canvas.getContext('experimental-webgl')
    if (!gl) return

    let program
    try {
      program = createProgram(gl, VERT, FRAG)
    } catch (e) {
      // If compilation fails, there's not much else we can do.
      // Intentionally fail silently to avoid breaking the page.
      console.error(e)
      return
    }

    const positionLoc = gl.getAttribLocation(program, 'a_position')
    const iResolutionLoc = gl.getUniformLocation(program, 'iResolution')
    const iTimeLoc = gl.getUniformLocation(program, 'iTime')
  const iMouseLoc = gl.getUniformLocation(program, 'iMouse')

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    gl.useProgram(program)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    let raf = 0
    const start = performance.now()

    let mouseX = -1
    let mouseY = -1
    const setMouseFromEvent = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = rect.height - (clientY - rect.top)
      mouseX = x
      mouseY = y
    }

    const onMouseMove = (e) => setMouseFromEvent(e.clientX, e.clientY)
    const onMouseLeave = () => {
      mouseX = -1
      mouseY = -1
    }
    const onTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return
      const t = e.touches[0]
      setMouseFromEvent(t.clientX, t.clientY)
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('touchstart', onTouchMove, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })

    const resize = () => {
      /* Cap DPR: full-viewport shader is expensive at 2× retina every frame */
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35)
      const w = Math.floor(canvas.clientWidth * dpr)
      const h = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      if (iResolutionLoc) gl.uniform3f(iResolutionLoc, w, h, 1)
    }

    let running = true
    const render = () => {
      if (!running) return
      const t = (performance.now() - start) / 1000
      if (iTimeLoc) gl.uniform1f(iTimeLoc, t)
      if (iMouseLoc) gl.uniform4f(iMouseLoc, mouseX, mouseY, 0, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(render)
    }

    const onResize = () => resize()
    resize()
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(() => resize())
    ro.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
        raf = 0
      } else {
        running = true
        if (!raf) raf = requestAnimationFrame(render)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    running = !document.hidden
    if (running) raf = requestAnimationFrame(render)

    return () => {
      running = false
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('touchstart', onTouchMove)
      canvas.removeEventListener('touchmove', onTouchMove)
      cancelAnimationFrame(raf)
      gl.deleteProgram(program)
      if (buffer) gl.deleteBuffer(buffer)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}

