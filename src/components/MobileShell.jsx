import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Bell, Box, Ellipsis, House, LayoutGrid } from 'lucide-react'
import { LogoMark } from './Logo'

const TABS = [
  { to: '/', label: 'Home', icon: House, match: (p) => p === '/' },
  { to: '/products', label: 'Products', icon: Box, match: (p) => p.startsWith('/products') },
  { to: '/services', label: 'Services', icon: LayoutGrid, match: (p) => p.startsWith('/services') },
  { to: '/more', label: 'More', icon: Ellipsis, match: (p) => !['/', '/products', '/services'].some((x) => x === '/' ? p === '/' : p.startsWith(x)) },
]

export function Splash() {
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem('drbady-splash') } catch { return true }
  })
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => {
      setShow(false)
      try { sessionStorage.setItem('drbady-splash', '1') } catch { /* ignore */ }
    }, 1700)
    return () => clearTimeout(t)
  }, [show])
  if (!show) return null
  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-brand">
        <LogoMark size={120} />
        <div className="splash-name">Dr Bady<sup>™</sup></div>
        <div className="splash-tag">Ideas • Build • Brand • Deliver</div>
      </div>
      <div className="splash-wave" />
      <div className="splash-bar"><span /></div>
    </div>
  )
}

export default function MobileShell({ children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isRoot = ['/', '/products', '/services', '/more'].includes(pathname)
  const isHome = pathname === '/'

  return (
    <div className="m-app">
      <header className="m-top">
        {!isRoot && (
          <button className="m-back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Back">
            <ArrowLeft size={24} />
          </button>
        )}
        <Link to="/" className="m-brand">
          <LogoMark size={30} /> <span>Dr Bady</span>
        </Link>
        {isHome && (
          <Link to="/more" className="m-bell" aria-label="Notifications"><Bell size={22} /></Link>
        )}
      </header>

      <main className={`m-main ${isHome ? 'm-main-home' : ''}`}>{children}</main>

      <nav className="m-tabs" aria-label="App">
        {TABS.map(({ to, label, icon: I, match }) => (
          <NavLink key={to} to={to} className={() => `m-tab ${match(pathname) ? 'active' : ''}`}>
            <I size={24} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** White rounded sheet used on mobile list/detail screens. */
export function Sheet({ title, children, flush }) {
  return (
    <section className={`m-sheet ${flush ? 'm-sheet-flush' : ''}`}>
      {title && <h1 className="m-sheet-title">{title}</h1>}
      {children}
    </section>
  )
}
