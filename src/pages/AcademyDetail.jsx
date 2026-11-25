import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  CalendarDays, Check, ChevronDown, Clock, MapPin, UsersRound, User, Gauge, Repeat, MessageCircle,
} from 'lucide-react'
import { useData, usePublicList } from '../lib/DataContext'
import { useIsMobile } from '../lib/hooks'
import { Icon } from '../lib/icons'
import { renderMarkdown } from '../lib/markdown'
import { Sheet } from '../components/MobileShell'
import { EnrollForm } from '../components/Forms'
import Seo, { absUrl, breadcrumbLd, useSiteBase } from '../components/Seo'
import { Modal, ProgramCard, fmtDate } from './Academy'

const todayIso = () => new Date().toISOString().slice(0, 10)

function dateRange(a) {
  if (!a.start_date) return null
  if (a.end_date && a.end_date !== a.start_date) return `${fmtDate(a.start_date)} – ${fmtDate(a.end_date)}`
  return fmtDate(a.start_date)
}

/** Built-in facts + the admin's own custom details, in one list. */
function facts(a) {
  return [
    dateRange(a) && { icon: CalendarDays, label: 'Date', value: dateRange(a) },
    a.schedule && { icon: Repeat, label: 'Schedule', value: a.schedule },
    a.duration && { icon: Clock, label: 'Duration', value: a.duration },
    a.location && { icon: MapPin, label: 'Location', value: a.location },
    a.level && { icon: Gauge, label: 'Level', value: a.level },
    a.capacity && { icon: UsersRound, label: 'Places', value: `${a.capacity} places` },
    a.instructor && { icon: User, label: 'With', value: a.instructor },
    ...(a.details || []).filter((d) => d.label || d.value).map((d) => ({ iconName: d.icon, label: d.label, value: d.value })),
  ].filter(Boolean)
}

function FactList({ items }) {
  return (
    <dl className="acd-facts">
      {items.map((f, i) => (
        <div key={i}>
          <dt>{f.icon ? <f.icon size={18} /> : <Icon name={f.iconName || 'Star'} size={18} />} {f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Faq({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="faq-list">
      {items.map((f, i) => (
        <div key={i} className={`faq ${open === i ? 'open' : ''}`}>
          <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {f.question} <ChevronDown size={20} />
          </button>
          {open === i && <p>{f.answer}</p>}
        </div>
      ))}
    </div>
  )
}

function courseMode(location = '') {
  const l = location.toLowerCase()
  const online = l.includes('online')
  const onsite = l && (!online || /&|and|in person|\//.test(l))
  return online && onsite ? 'Blended' : online ? 'Online' : 'Onsite'
}

function priceNumber(price = '') {
  if (!price || /free/i.test(price)) return { price: 0, currency: 'GBP' }
  const n = parseFloat(String(price).replace(/[^0-9.]/g, ''))
  if (Number.isNaN(n)) return null
  const currency = /£/.test(price) ? 'GBP' : /\$/.test(price) ? 'USD' : /€/.test(price) ? 'EUR' : /d|gmd/i.test(price) ? 'GMD' : 'GBP'
  return { price: n, currency }
}

export default function AcademyDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const programs = usePublicList('academy_programs')
  const { settings } = useData()
  const isMobile = useIsMobile()
  const base = useSiteBase()
  const [registering, setRegistering] = useState(false)
  const a = programs?.find((x) => x.slug === slug)

  const html = useMemo(
    () => (a?.content ? DOMPurify.sanitize(renderMarkdown(a.content).html, { ADD_ATTR: ['target'] }) : ''),
    [a?.content],
  )

  if (programs === null)
    return isMobile ? <Sheet><p className="muted">Loading…</p></Sheet> : <section className="section page-top"><div className="container"><p className="muted">Loading…</p></div></section>

  if (!a) {
    const nf = (
      <div className="b-empty">
        <Seo title="Programme not found" noindex />
        <h1>Programme not found</h1>
        <p className="muted">It may have finished or been removed.</p>
        <Link to="/academy" className="btn btn-gold btn-pill">See all programmes</Link>
      </div>
    )
    return isMobile ? <Sheet>{nf}</Sheet> : <section className="section page-top"><div className="container container-narrow">{nf}</div></section>
  }

  const url = `${base}/academy/${a.slug}`
  const orgName = settings.seo_site_name || 'Dr Bady'
  const endOrStart = a.end_date || a.start_date
  const isPast = !!endOrStart && endOrStart < todayIso()
  const ctaLabel = isPast ? 'Register interest' : a.cta_label || 'Register now'
  const items = facts(a)
  const others = programs.filter((x) => x.id !== a.id).slice(0, 3)
  const offer = priceNumber(a.price)

  const onContentClick = (e) => {
    const link = e.target.closest('a')
    const href = link?.getAttribute('href')
    if (!href || link.target || !href.startsWith('/') || e.metaKey || e.ctrlKey) return
    e.preventDefault()
    navigate(href)
  }

  const seo = (
    <Seo
      title={a.meta_title || a.title}
      description={a.meta_description || a.short_description}
      image={a.og_image || a.cover_image}
      noindex={a.noindex}
      canonicalPath={`/academy/${a.slug}`}
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: a.title,
          description: a.meta_description || a.short_description || a.title,
          url,
          image: absUrl(base, a.og_image || a.cover_image),
          provider: { '@type': 'Organization', name: orgName, sameAs: base },
          ...(a.level ? { educationalLevel: a.level } : {}),
          ...(a.outcomes?.length ? { teaches: a.outcomes } : {}),
          ...(offer ? { offers: { '@type': 'Offer', category: offer.price ? 'Paid' : 'Free', price: offer.price, priceCurrency: offer.currency, url } } : {}),
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: courseMode(a.location),
            ...(a.start_date ? { startDate: a.start_date } : {}),
            ...(a.end_date ? { endDate: a.end_date } : {}),
            ...(a.location ? { location: a.location } : {}),
            ...(a.duration ? { courseWorkload: a.duration } : {}),
            ...(a.instructor ? { instructor: { '@type': 'Person', name: a.instructor } } : {}),
          },
        },
        a.faqs?.length ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: a.faqs.filter((f) => f.question && f.answer).map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
        } : null,
        breadcrumbLd(base, [{ name: 'Home', path: '/' }, { name: 'Academy', path: '/academy' }, { name: a.title, path: `/academy/${a.slug}` }]),
      ]}
    />
  )

  const registerBox = (
    <div className="acd-box">
      <div className="acd-price">
        <span>Price</span>
        <b>{a.price || 'Free'}</b>
      </div>
      {isPast && <p className="acd-past">This date has passed. Register your interest and we'll tell you about the next one.</p>}
      <button type="button" className="btn btn-gold btn-pill btn-block btn-lg" onClick={() => setRegistering(true)}>
        <CalendarDays size={20} /> {ctaLabel}
      </button>
      <Link to="/book" className="btn btn-outline-dark btn-pill btn-block"><MessageCircle size={18} /> Ask a question</Link>
    </div>
  )

  const main = (
    <>
      {a.outcomes?.length > 0 && (
        <section className="acd-sec">
          <h2>What you will learn</h2>
          <ul className="d-checks acd-checks">
            {a.outcomes.map((o, i) => <li key={i}><span className="tick"><Check size={16} strokeWidth={3.5} /></span>{o}</li>)}
          </ul>
        </section>
      )}
      {html && <section className="acd-sec b-prose" onClick={onContentClick} dangerouslySetInnerHTML={{ __html: html }} />}
      {!html && a.description && <section className="acd-sec"><p className="d-desc">{a.description}</p></section>}
      {a.requirements?.length > 0 && (
        <section className="acd-sec">
          <h2>What you need</h2>
          <ul className="acd-req">{a.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      )}
      {a.faqs?.length > 0 && (
        <section className="acd-sec">
          <h2>Questions &amp; answers</h2>
          <Faq items={a.faqs.filter((f) => f.question)} />
        </section>
      )}
    </>
  )

  const modal = registering && (
    <Modal title={`Register: ${a.title}`} onClose={() => setRegistering(false)}>
      <EnrollForm program={a} onDone={() => setRegistering(false)} />
    </Modal>
  )

  const othersBlock = others.length > 0 && (
    <section aria-label="Other programmes">
      <h2 className="more-title">More from the Academy</h2>
      <div className="ac-grid">{others.map((o) => <ProgramCard key={o.id} a={o} onRegister={() => navigate(`/academy/${o.slug}`)} />)}</div>
    </section>
  )

  if (isMobile)
    return (
      <Sheet flush>
        {seo}
        {a.cover_image && <div className="d-hero acd-hero-m"><img src={a.cover_image} alt={a.title} /></div>}
        <div className="d-pad acd-m">
          <div className="acd-chips">
            {a.kind && <span className="ac-kind-inline">{a.kind}</span>}
            {a.level && <span className="acd-chip">{a.level}</span>}
          </div>
          <h1>{a.title}</h1>
          {a.short_description && <p className="d-tag">{a.short_description}</p>}
          {items.length > 0 && <FactList items={items} />}
          {registerBox}
          {main}
          {othersBlock}
        </div>
        {modal}
      </Sheet>
    )

  return (
    <section className="section page-top">
      {seo}
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <Link to="/academy">Academy</Link> / <span>{a.title}</span></nav>
        <div className="acd-top">
          {a.cover_image && (
            <div className="acd-media">
              <img src={a.cover_image} alt={a.title} fetchPriority="high" />
              {a.kind && <span className="ac-kind">{a.kind}</span>}
            </div>
          )}
          <div className="acd-intro">
            <div className="acd-chips">
              {!a.cover_image && a.kind && <span className="ac-kind-inline">{a.kind}</span>}
              {a.level && <span className="acd-chip">{a.level}</span>}
              {isPast && <span className="acd-chip muted-chip">Past date</span>}
            </div>
            <h1>{a.title}</h1>
            {a.short_description && <p className="d-tag">{a.short_description}</p>}
            {items.length > 0 && <FactList items={items.slice(0, 6)} />}
          </div>
        </div>
        <div className="acd-layout">
          <div className="acd-main">{main}</div>
          <aside className="acd-side">
            {registerBox}
            {items.length > 6 && <FactList items={items.slice(6)} />}
          </aside>
        </div>
        {othersBlock}
      </div>
      {modal}
    </section>
  )
}
