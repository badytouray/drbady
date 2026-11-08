import { Link } from 'react-router-dom'

export function LogoMark({ size = 44, className = '' }) {
  return (
    <svg className={`logo-mark ${className}`} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="lm-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD23F" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path d="M6 14 A36 36 0 0 1 6 86 Z" fill="url(#lm-gold)" />
      <path
        d="M20 4 H54 A46 46 0 0 1 54 96 H20 V82 H54 A32 32 0 0 0 54 18 H20 Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function Logo({ to = '/', tagline = true, size = 44 }) {
  return (
    <Link to={to} className="logo" aria-label="Dr Bady home">
      <LogoMark size={size} />
      <span className="logo-text">
        <span className="logo-name">
          Dr Bady<sup>™</sup>
        </span>
        {tagline && <span className="logo-tag">Ideas • Build • Brand • Deliver</span>}
      </span>
    </Link>
  )
}
