import { useParams, Navigate, Link } from 'react-router-dom'
import { Check, CalendarDays } from 'lucide-react'
import { useData } from '../lib/DataContext'
import { useIsMobile } from '../lib/hooks'
import { Icon } from '../lib/icons'
import { Sheet } from '../components/MobileShell'
import ListRow from '../components/ListRow'
import { BookingForm } from '../components/Forms'
import { SectionTitle } from './Home'

export function ServicesPage() {
  const { services } = useData()
  if (useIsMobile())
    return (
      <Sheet title="My Services">
        <div className="m-list m-list-tight">
          {services.map((s) => (
            <ListRow key={s.id} compact to={`/services/${s.slug}`} icon={s.icon} title={s.title} desc={s.short_description} />
          ))}
        </div>
      </Sheet>
    )
  return (
    <section className="section page-top">
      <div className="container">
        <SectionTitle first="My" underline="Services" sub={<>Hands-on support to bring your ideas, <b>brand and</b> business to life.</>} />
        <div className="svc-grid">
          {services.map((s) => (
            <Link key={s.id} to={`/services/${s.slug}`} className="svc-card">
              <span className="svc-card-icon"><Icon name={s.icon} size={34} strokeWidth={1.8} /></span>
              <h3>{s.title}</h3>
              <p>{s.short_description}</p>
              {s.features?.length > 0 && (
                <ul>{s.features.slice(0, 4).map((f, i) => <li key={i}><Check size={14} strokeWidth={3} /> {f}</li>)}</ul>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ServiceDetail() {
  const { slug } = useParams()
  const { services, loading } = useData()
  const isMobile = useIsMobile()
  const s = services.find((x) => x.slug === slug)
  if (!s) return loading ? null : <Navigate to="/services" replace />

  const body = (
    <>
      {s.description && <p className="d-desc">{s.description}</p>}
      {s.features?.length > 0 && (
        <ul className="d-checks">
          {s.features.map((f, i) => <li key={i}><span className="tick"><Check size={16} strokeWidth={3.5} /></span>{f}</li>)}
        </ul>
      )}
    </>
  )

  if (isMobile)
    return (
      <Sheet>
        <div className="svc-head">
          <span className="svc-card-icon"><Icon name={s.icon} size={34} strokeWidth={1.8} /></span>
          <div><h1>{s.title}</h1><p className="d-tag">{s.short_description}</p></div>
        </div>
        {s.cover_image && <img className="svc-cover" src={s.cover_image} alt="" />}
        {body}
        <h2 className="form-title"><CalendarDays size={20} /> Book a free chat</h2>
        <BookingForm defaultTopic={s.title} />
      </Sheet>
    )

  return (
    <section className="section page-top">
      <div className="container">
        <nav className="crumbs"><Link to="/services">Services</Link> / <span>{s.title}</span></nav>
        <div className="detail-grid">
          <div className="detail-copy">
            <div className="svc-head">
              <span className="svc-card-icon"><Icon name={s.icon} size={40} strokeWidth={1.8} /></span>
              <div><h1>{s.title}</h1><p className="d-tag">{s.short_description}</p></div>
            </div>
            {s.cover_image && <img className="svc-cover" src={s.cover_image} alt="" />}
            {body}
          </div>
          <div className="card form-card">
            <h2 className="form-title"><CalendarDays size={22} /> Book a free chat</h2>
            <BookingForm defaultTopic={s.title} />
          </div>
        </div>
      </div>
    </section>
  )
}
