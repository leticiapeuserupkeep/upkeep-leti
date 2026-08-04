/**
 * WelcomeScreen Nova orb — same animation as
 * `app/components/command-center/onboarding/SupernovaOrb.tsx` (180×180).
 *
 * In the app it is rendered inside:
 *   <div className="relative flex justify-center -my-2"><SupernovaOrb /></div>
 * Use `WelcomeScreenOrb` below for a drop-in match, or the default export for the orb only.
 *
 * Copy-paste into another repo:
 * - React 18+; add "use client" for Next.js App Router.
 * - No Tailwind or path aliases required.
 * - Optional `size` prop scales the whole graphic (default 1 = 180px box).
 */

'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

const STYLES = `
  @keyframes orb-float-v2 {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-13px); }
  }
  @keyframes orb-shadow-v2 {
    0%, 100% { transform: translateX(-50%) scaleX(1);    opacity: 0.28; filter: blur(10px); }
    50%       { transform: translateX(-50%) scaleX(0.55); opacity: 0.09; filter: blur(14px); }
  }
  @keyframes ring-spin-cw {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ring-spin-ccw {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes orb-ambient-pulse {
    0%, 100% { transform: scale(1);    opacity: 0.32; }
    50%       { transform: scale(1.15); opacity: 0.12; }
  }
  @keyframes orb-wave-expand {
    0%   { transform: translate(-50%,-50%) scale(0.7); opacity: 0.45; }
    100% { transform: translate(-50%,-50%) scale(1.7); opacity: 0; }
  }
  @keyframes orb-dot-orbit {
    from { transform: rotate(var(--start-angle)) translateX(var(--radius)) rotate(calc(-1 * var(--start-angle))); }
    to   { transform: rotate(calc(var(--start-angle) + 360deg)) translateX(var(--radius)) rotate(calc(-1 * (var(--start-angle) + 360deg))); }
  }
  @media (prefers-reduced-motion: reduce) {
    .nova-orb-standalone * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`

function noise(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 2.4 + t * 0.55) * Math.cos(y * 1.85 - t * 0.48) * 0.5 +
    Math.sin(x * 3.9 - t * 0.72 + y * 1.3) * 0.3 +
    Math.cos(x * 1.4 + y * 3.0 + t * 0.88) * 0.2
  )
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function getBaseColor(n1: number, n2: number, t: number): [number, number, number] {
  const hue = 205 + n1 * 28 + Math.sin(t * 0.28 + n2 * 2.2) * 14
  const sat = 80 + n2 * 12
  const lig = 48 + n1 * 14 + n2 * 6
  return hslToRgb(
    ((hue % 360) + 360) % 360,
    Math.min(95, Math.max(60, sat)),
    Math.min(68, Math.max(28, lig)),
  )
}

const STYLE_ID = 'supernova-orb-standalone-styles'

export type SupernovaOrbStandaloneProps = {
  /** Visual scale (1 = ~180×180 px wrapper). */
  size?: number
  className?: string
}

function SupernovaOrbStandalone({ size = 1, className = '' }: SupernovaOrbStandaloneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  const dim = 180 * size

  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement('style')
      el.id = STYLE_ID
      el.textContent = STYLES
      document.head.appendChild(el)
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctxMaybe = canvas.getContext('2d')
    if (!ctxMaybe) return
    const ctx2d: CanvasRenderingContext2D = ctxMaybe

    const W = 100
    const H = 100
    const R = 48
    const CX = 50
    const CY = 50
    let t = 0
    let cancelled = false

    let reduceMotion = false
    try {
      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      /* ignore */
    }

    function draw() {
      if (cancelled) return
      const imageData = ctx2d.createImageData(W, H)
      const data = imageData.data

      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const dx = px - CX
          const dy = py - CY
          const dist2 = dx * dx + dy * dy

          if (dist2 > (R + 1) * (R + 1)) {
            data[(py * W + px) * 4 + 3] = 0
            continue
          }

          const dist = Math.sqrt(dist2)
          const nx = dx / R
          const ny = dy / R
          const nzSq = 1 - nx * nx - ny * ny
          const nz = nzSq > 0 ? Math.sqrt(nzSq) : 0
          const u = nx * 0.5 + 0.5
          const v = ny * 0.5 + 0.5

          const angle = Math.atan2(dy, dx)
          const swirl = Math.sin((dist / R) * Math.PI) * 0.11
          const su = u + Math.sin(angle * 2.5 + t * 0.48) * swirl
          const sv = v + Math.cos(angle * 1.8 - t * 0.4) * swirl

          const n1 = noise(su * 3.0 + t * 0.27, sv * 3.0 - t * 0.32, t)
          const n2 = noise(su * 2.0 - t * 0.21 + 1.8, sv * 2.0 + t * 0.25 + 2.4, t * 1.1)
          const n3 = noise(su * 2.8 - t * 0.38 + 3.1, sv * 2.1 + t * 0.3 + 4.7, t * 0.75)

          let [r, g, b] = getBaseColor(n1, n2, t)

          const pn = Math.max(0, Math.min(1, (n3 - 0.05) / 0.65))
          const pink = pn * pn * (3 - 2 * pn)
          const pinkStr = pink * 0.45
          r += pinkStr * 110
          g += pinkStr * 10
          b += pinkStr * 20

          const klx = -0.38
          const kly = -0.55
          const klz = 0.74
          const klLen = Math.sqrt(klx * klx + kly * kly + klz * klz)
          const kDiff = Math.max(0, (nx * klx + ny * kly + nz * klz) / klLen)

          const flx = 0.4
          const fly = 0.3
          const flz = 0.87
          const flLen = Math.sqrt(flx * flx + fly * fly + flz * flz)
          const fDiff = Math.max(0, (nx * flx + ny * fly + nz * flz) / flLen) * 0.22

          const hx = klx / klLen
          const hy = kly / klLen
          const hz = klz / klLen + 1
          const hLen = Math.sqrt(hx * hx + hy * hy + hz * hz)
          const specDot = Math.max(0, (nx * hx) / hLen + (ny * hy) / hLen + (nz * hz) / hLen)
          const specHard = specDot ** 52 * 1.05
          const specSoft = specDot ** 8 * 0.14

          const fresnel = (1 - Math.max(0, nz)) ** 3.1 * 0.26

          const ambient = 0.18
          const litAmt = ambient + kDiff * 0.72 + fDiff + specSoft

          r = r * litAmt + specHard * 210 + fresnel * 44 + pinkStr * specHard * 32
          g = g * litAmt + specHard * 198 + fresnel * 82
          b = b * litAmt + specHard * 228 + fresnel * 118

          r = Math.min(255, Math.max(0, Math.round(r)))
          g = Math.min(255, Math.max(0, Math.round(g)))
          b = Math.min(255, Math.max(0, Math.round(b)))

          const litTotal = Math.min(1, ambient + kDiff * 0.72 + fDiff)
          const glassAlpha = 0.18 + litTotal * 0.68
          const edgeAlpha = dist >= R - 1 ? Math.max(0, R - dist) : 1

          const idx = (py * W + px) * 4
          data[idx] = r
          data[idx + 1] = g
          data[idx + 2] = b
          data[idx + 3] = Math.round(edgeAlpha * glassAlpha * 255)
        }
      }

      ctx2d.putImageData(imageData, 0, 0)
      if (!reduceMotion) {
        t += 0.014
        if (!cancelled) {
          rafRef.current = requestAnimationFrame(draw)
        }
      }
    }

    draw()
    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const rootStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    height: dim,
    width: dim,
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div className={`nova-orb-standalone ${className}`.trim()} style={rootStyle}>
      {[0, 1.5].map((delay) => (
        <div
          key={delay}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 158 * size,
            height: 158 * size,
            borderRadius: '50%',
            border: '1px solid rgba(147,197,253,0.2)',
            animation: `orb-wave-expand 3s ease-out infinite ${delay}s`,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          width: 167 * size,
          height: 167 * size,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(37,99,235,0.055) 50%, transparent 76%)',
          filter: 'blur(18px)',
          animation: 'orb-ambient-pulse 4.5s ease-in-out infinite',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 133 * size,
          height: 133 * size,
          borderRadius: '50%',
          background: `conic-gradient(
          from 0deg,
          rgba(186,230,253,0.0)  0%,
          rgba(96,165,250,0.65)  12%,
          rgba(249,168,212,0.55) 26%,
          rgba(59,130,246,0.50)  40%,
          rgba(147,197,253,0.06) 55%,
          rgba(37,99,235,0.58)   70%,
          rgba(186,230,253,0.38) 86%,
          rgba(186,230,253,0.0)  100%
        )`,
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), #fff calc(100% - 1px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), #fff calc(100% - 1px))',
          animation: 'ring-spin-cw 5s linear infinite',
          filter: 'blur(0.6px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 113 * size,
          height: 113 * size,
          borderRadius: '50%',
          background: `conic-gradient(
          from 180deg,
          rgba(125,211,252,0.0)  0%,
          rgba(56,189,248,0.60)  22%,
          rgba(96,165,250,0.75)  42%,
          rgba(186,230,253,0.06) 62%,
          rgba(37,99,235,0.60)   82%,
          rgba(125,211,252,0.0)  100%
        )`,
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), #fff calc(100% - 1px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), #fff calc(100% - 1px))',
          animation: 'ring-spin-ccw 7s linear infinite',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 97 * size,
          height: 97 * size,
          borderRadius: '50%',
          background: `conic-gradient(
          from 90deg,
          rgba(186,230,253,0.0)  0%,
          rgba(147,197,253,0.65) 28%,
          rgba(186,230,253,0.0)  55%,
          rgba(96,165,250,0.50)  78%,
          rgba(186,230,253,0.0)  100%
        )`,
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), #fff calc(100% - 1px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), #fff calc(100% - 1px))',
          animation: 'ring-spin-cw 3.5s linear infinite',
        }}
      />

      {[
        {
          size: 4 * size,
          color: '#e0f2fe',
          glow: 'rgba(56,189,248,0.9)',
          gradientEnd: 'rgb(56,189,248)',
          angle: '0deg',
          radius: `${53 * size}px`,
          duration: '6s',
        },
        {
          size: 3 * size,
          color: '#bfdbfe',
          glow: 'rgba(96,165,250,0.8)',
          gradientEnd: 'rgb(96,165,250)',
          angle: '130deg',
          radius: `${53 * size}px`,
          duration: '9s',
        },
        {
          size: 3 * size,
          color: '#dbeafe',
          glow: 'rgba(147,197,253,0.85)',
          gradientEnd: 'rgb(147,197,253)',
          angle: '255deg',
          radius: `${53 * size}px`,
          duration: '11s',
        },
      ].map(({ size: dotSize, color, glow, gradientEnd, angle, radius, duration }, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: dotSize,
            height: dotSize,
            marginTop: -dotSize / 2,
            marginLeft: -dotSize / 2,
          }}
        >
          <div
            style={
              {
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color} 0%, ${gradientEnd} 100%)`,
                boxShadow: `0 0 6px 2px ${glow}`,
                '--start-angle': angle,
                '--radius': radius,
                animation: `orb-dot-orbit ${duration} linear infinite`,
              } as unknown as CSSProperties
            }
          />
        </div>
      ))}

      <div
        style={{
          position: 'relative',
          animation: 'orb-float-v2 5s ease-in-out infinite',
        }}
      >
        <canvas
          ref={canvasRef}
          width={100}
          height={100}
          style={{
            display: 'block',
            width: 90 * size,
            height: 90 * size,
            borderRadius: '50%',
            boxShadow: `
              0 0 0 0.33px rgba(200,225,255,0.032),
              0 0 22px 6px rgba(59,130,246,0.14),
              0 8px 32px rgba(37,99,235,0.16),
              0 2px 5px rgba(0,0,0,0.12)
            `,
          }}
        />

        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: '50%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '5%',
              left: '10%',
              width: '55%',
              height: '45%',
              borderRadius: '50%',
              background: `radial-gradient(ellipse at 35% 30%,
              rgba(255,255,255,0.72)  0%,
              rgba(255,255,255,0.52) 18%,
              rgba(255,255,255,0.28) 40%,
              rgba(255,255,255,0.06) 65%,
              transparent 85%
            )`,
              filter: 'blur(2px)',
              mixBlendMode: 'screen',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '16%',
              width: '20%',
              height: '16%',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
              filter: 'blur(1px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '6%',
              left: '18%',
              width: '64%',
              height: '22%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(125,211,252,0.28) 0%, transparent 80%)',
              filter: 'blur(4px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '22%',
              left: '2%',
              width: '10%',
              height: '55%',
              borderRadius: '50%',
              background: 'linear-gradient(to right, rgba(255,255,255,0.045), transparent)',
              filter: 'blur(2px)',
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 3 * size,
          left: '50%',
          width: 52 * size,
          height: 9 * size,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.22) 0%, transparent 78%)',
          filter: 'blur(8px)',
          animation: 'orb-shadow-v2 5s ease-in-out infinite',
        }}
      />
    </div>
  )
}

/** Tailwind `relative flex justify-center -my-2` as inline styles + orb (WelcomeScreen parity). */
const welcomeScreenOrbShellStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  marginTop: '-0.5rem',
  marginBottom: '-0.5rem',
}

export type WelcomeScreenOrbProps = SupernovaOrbStandaloneProps & {
  /** Classes on the outer shell only (optional; e.g. Tailwind). */
  shellClassName?: string
}

export function WelcomeScreenOrb({
  size,
  className,
  shellClassName = '',
}: WelcomeScreenOrbProps) {
  return (
    <div className={shellClassName.trim()} style={welcomeScreenOrbShellStyle}>
      <SupernovaOrbStandalone size={size} className={className} />
    </div>
  )
}

export default SupernovaOrbStandalone
