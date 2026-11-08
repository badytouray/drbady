import { useParams, Navigate, Link } from 'react-router-dom'
import { Check, ChevronRight, ArrowRight } from 'lucide-react'
import { useData } from '../lib/DataContext'
import { useIsMobile } from '../lib/hooks'
import { Icon } from '../lib/icons'
import { Sheet } from '../components/MobileShell'
import ListRow from '../components/ListRow'
import SmartLink from '../components/SmartLink'
import { ProductCard, SectionTitle } from './Home'

export function ProductsPage() {
  const { products } = useData()
  if (useIsMobile())
    return (
      <Sheet title="My Products">
        <div className="m-list">
          {products.map((p) => (
            <ListRow key={p.id} to={`/products/${p.slug}`} icon={p.icon} color={p.accent} title={p.title} desc={p.short_description} />
          ))}
        </div>
      </Sheet>
    )
  return (
    <section className="section page-top">
      <div className="container">
        <SectionTitle first="My" underline="Products" sub="Purpose-built solutions for real-world needs." />
        <div className="p-grid">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </div>
    </section>
  )
}

/** Shared body for product detail — links list and/or features checklist + CTA. */
function DetailBody({ p }) {
  return (
    <>
      {p.links?.length > 0 && (
        <div className="d-links">
          {p.links.map((l, i) => (
            <SmartLink key={i} to={l.url || '#'} className="d-link">
              <Icon name={l.icon || 'ChevronRight'} size={24} strokeWidth={2} />
              <span>{l.label}</span>
              <ChevronRight size={20} strokeWidth={2.4} />
            </SmartLink>
          ))}
        </div>
      )}
      {p.features?.length > 0 && (
        <ul className="d-checks">
          {p.features.map((f, i) => (
            <li key={i}><span className="tick"><Check size={16} strokeWidth={3.5} /></span>{f}</li>
          ))}
        </ul>
      )}
      {p.description && <div className="d-desc">{p.description}</div>}
      {p.cta_label && (
        <SmartLink to={p.cta_url || '/book'} className="btn btn-gold btn-pill btn-block btn-lg d-cta">
          <Icon name={p.cta_icon || 'ExternalLink'} size={22} /> {p.cta_label}
        </SmartLink>
      )}
    </>
  )
}

export function ProductDetail() {
  const { slug } = useParams()
  const { products, loading } = useData()
  const isMobile = useIsMobile()
  const p = products.find((x) => x.slug === slug)
  if (!p) return loading ? null : <Navigate to="/products" replace />

  if (isMobile)
    return (
      <Sheet flush>
        <div className="d-hero"><img src={p.cover_image} alt="" /></div>
        <div className="d-head">
          <span className="d-badge" style={{ background: p.accent }}><Icon name={p.icon} size={30} strokeWidth={2.2} /></span>
          <h1>{p.title}</h1>
        </div>
        <div className="d-pad">
          <p className="d-tag">{p.tagline || p.short_description}</p>
          <DetailBody p={p} />
        </div>
      </Sheet>
    )

  const others = products.filter((x) => x.id !== p.id)
  return (
    <section className="section page-top">
      <div className="container">
        <nav className="crumbs"><Link to="/products">Products</Link> / <span>{p.title}</span></nav>
        <div className="detail-grid">
          <div className="detail-media">
            <img src={p.cover_image} alt="" />
            <span className="d-badge d-badge-lg" style={{ background: p.accent }}><Icon name={p.icon} size={40} strokeWidth={2} /></span>
          </div>
          <div className="detail-copy">
            <h1>{p.title}</h1>
            <p className="d-tag">{p.tagline || p.short_description}</p>
            <DetailBody p={p} />
            <Link to="/book" className="text-link">Questions? Book a chat <ArrowRight size={16} /></Link>
          </div>
        </div>
        {others.length > 0 && (
          <>
            <h2 className="more-title">More products</h2>
            <div className="p-grid p-grid-3">{others.map((o) => <ProductCard key={o.id} p={o} />)}</div>
          </>
        )}
      </div>
    </section>
  )
}
