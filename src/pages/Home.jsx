import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Layers, LayoutGrid, Rocket, Users, CircleArrowRight } from 'lucide-react'
import { useData } from '../lib/DataContext'
import { Icon, WhatsAppIcon } from '../lib/icons'
import { useIsMobile, waLink } from '../lib/hooks'

export function TwoLine({ text }) {
  // "Branding & Design" -> "Branding" / "& Design"; "Web Development" -> "Web" / "Development"
  const i = text.indexOf(' & ')
  if (i > 0) return <>{text.slice(0, i)}<br />{text.slice(i + 1)}</>
  const j = text.indexOf(' ')
  if (j > 0) return <>{text.slice(0, j)}<br />{text.slice(j + 1)}</>
  return text
}

export function ProductCard({ p }) {
  return (
    <Link to={`/products/${p.slug}`} className="p-card">
      <div className="p-card-img"><img src={p.cover_image} alt="" loading="lazy" /></div>
      <div className="p-card-body">
        <span className="p-card-icon" style={{ '--accent': p.accent }}><Icon name={p.icon} size={30} strokeWidth={2} /></span>
        <h3>{p.title}</h3>
        <p>{p.short_description}</p>
        <CircleArrowRight className="p-card-go" size={28} strokeWidth={1.8} />
      </div>
    </Link>
  )
}

export function SectionTitle({ first, underline, sub }) {
  return (
    <div className="section-title">
      <h2>{first} <span className="u-gold">{underline}</span></h2>
      {sub && <p>{sub}</p>}
    </div>
  )
}

function DesktopHome() {
  const { settings: s, products, services } = useData()
  return (
    <>
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: 'url(/images/creative_workspace.png)' }} />
        <svg className="hero-swoosh" viewBox="0 0 600 800" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sw" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#F59E0B" stopOpacity="0" />
              <stop offset=".45" stopColor="#FFB000" />
              <stop offset="1" stopColor="#FFD54A" />
            </linearGradient>
          </defs>
          <path d="M40 800 C 260 560, 380 320, 560 0 L 600 0 C 420 330, 320 560, 120 800 Z" fill="url(#sw)" />
        </svg>
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>
              <span>{s.hero_title_1}</span>
              <span className="gold underline-brush">{s.hero_title_2}</span>
            </h1>
            <p className="hero-sub">{s.hero_subtitle}</p>
            <div className="hero-ctas">
              <Link to="/products" className="btn btn-gold btn-pill btn-lg">
                <LayoutGrid size={22} /> Explore Products <ArrowRight size={20} />
              </Link>
              <Link to="/book" className="btn btn-outline-light btn-pill btn-lg">
                <CalendarDays size={22} /> Book a Chat
              </Link>
            </div>
            <ul className="hero-points">
              <li><Rocket size={34} strokeWidth={1.6} /><span>Real Solutions<br />That Work</span></li>
              <li><Layers size={34} strokeWidth={1.6} /><span>From Idea<br />to Launch</span></li>
              <li><Users size={34} strokeWidth={1.6} /><span>For People,<br />Businesses &amp; Communities</span></li>
            </ul>
          </div>
          <div className="hero-figure">
            <img src={s.hero_image} alt="Dr Bady" />
          </div>
        </div>
      </section>

      <section className="section products-section">
        <div className="container">
          <SectionTitle first="My" underline="Products" sub="Purpose-built solutions for real-world needs." />
          <div className="p-grid">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      <section className="section services-section">
        <div className="container">
          <SectionTitle first="My" underline="Services" sub={<>Hands-on support to bring your ideas, <b>brand and</b> business to life.</>} />
          <div className="svc-strip">
            {services.map((sv) => (
              <Link key={sv.id} to={`/services/${sv.slug}`} className="svc-item">
                <Icon name={sv.icon} size={44} strokeWidth={1.8} />
                <span><TwoLine text={sv.short_title || sv.title} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function MobileHome() {
  const { settings: s } = useData()
  return (
    <section className="m-hero">
      <div className="m-hero-img">
        <div className="m-hero-glow" style={{ backgroundImage: 'url(/images/creative_workspace.png)' }} />
        <img src={s.hero_image} alt="Dr Bady" />
      </div>
      <div className="m-hero-copy">
        <h1>
          {s.mobile_hero_title_1?.replace(/-/g, '\u2011')} <span className="gold">{s.mobile_hero_title_2}</span>
        </h1>
        <p>{s.mobile_hero_subtitle}</p>
        <Link to="/products" className="btn btn-gold btn-pill btn-block">
          Explore Products <ArrowRight size={20} />
        </Link>
        <a href={waLink(s.whatsapp)} target="_blank" rel="noreferrer" className="btn btn-outline-light btn-pill btn-block m-wa">
          <WhatsAppIcon size={30} />
          <span><b>Chat on WhatsApp</b><small>{s.phone}</small></span>
        </a>
      </div>
    </section>
  )
}

export default function Home() {
  return useIsMobile() ? <MobileHome /> : <DesktopHome />
}
