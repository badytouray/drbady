import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Logo } from './Logo'
import { Icon, WhatsAppIcon } from '../lib/icons'
import { useData } from '../lib/DataContext'
import { waLink } from '../lib/hooks'

function Dropdown({ label, to, items, base }) {
  return (
    <div className="nav-dd">
      <NavLink to={to} className="nav-link">
        {label} <ChevronDown size={18} strokeWidth={2.4} />
      </NavLink>
      <div className="nav-dd-menu">
        {items.map((it) => (
          <Link key={it.id} to={`${base}/${it.slug}`} className="nav-dd-item">
            <span className="nav-dd-icon"><Icon name={it.icon} size={18} /></span>
            <span>
              <strong>{it.title}</strong>
              <small>{it.short_description}</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Header() {
  const { settings, products, services } = useData()
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header className={`site-header ${scrolled || pathname !== '/' ? 'is-solid' : ''}`}>
      <div className="container header-inner">
        <Logo />
        <nav className="main-nav" aria-label="Main">
          <Dropdown label="Products" to="/products" items={products} base="/products" />
          <Dropdown label="Services" to="/services" items={services} base="/services" />
          <NavLink to="/academy" className="nav-link">Academy</NavLink>
          <NavLink to="/about" className="nav-link">About Dr Bady</NavLink>
          <NavLink to="/contact" className="nav-link">Contact</NavLink>
        </nav>
        <a className="btn btn-outline-gold btn-pill phone-pill" href={waLink(settings.whatsapp)} target="_blank" rel="noreferrer">
          <WhatsAppIcon size={22} /> {settings.phone}
        </a>
      </div>
    </header>
  )
}
