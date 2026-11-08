import { useState } from 'react'
import { CalendarDays, Clock, MapPin, Check, X } from 'lucide-react'
import { usePublicList } from '../lib/DataContext'
import { useIsMobile } from '../lib/hooks'
import { Sheet } from '../components/MobileShell'
import { EnrollForm } from '../components/Forms'
import { SectionTitle } from './Home'

function fmtDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProgramCard({ a, onRegister }) {
  return (
    <article className="ac-card">
      {a.cover_image && <div className="ac-img"><img src={a.cover_image} alt="" loading="lazy" /><span className="ac-kind">{a.kind}</span></div>}
      <div className="ac-body">
        <h3>{a.title}</h3>
        <p>{a.short_description}</p>
        <ul className="ac-meta">
          {a.start_date && <li><CalendarDays size={16} /> {fmtDate(a.start_date)}</li>}
          {a.duration && <li><Clock size={16} /> {a.duration}</li>}
          {a.location && <li><MapPin size={16} /> {a.location}</li>}
        </ul>
        {a.outcomes?.length > 0 && (
          <ul className="ac-outcomes">{a.outcomes.map((o, i) => <li key={i}><Check size={14} strokeWidth={3} /> {o}</li>)}</ul>
        )}
        <div className="ac-foot">
          <span className="ac-price">{a.price || 'Free'}</span>
          <button className="btn btn-gold btn-pill" onClick={() => onRegister(a)}>
            <CalendarDays size={18} /> Join
          </button>
        </div>
      </div>
    </article>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close"><X size={22} /></button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export default function Academy() {
  const programs = usePublicList('academy_programs')
  const [sel, setSel] = useState(null)
  const isMobile = useIsMobile()

  const list = (
    <div className="ac-grid">
      {programs === null && <p className="muted">Loading…</p>}
      {programs?.length === 0 && <p className="muted">New workshops are coming soon. Book a chat to hear first.</p>}
      {programs?.map((a) => <ProgramCard key={a.id} a={a} onRegister={setSel} />)}
    </div>
  )
  const modal = sel && (
    <Modal title={`Register: ${sel.title}`} onClose={() => setSel(null)}>
      <EnrollForm program={sel} onDone={() => setSel(null)} />
    </Modal>
  )

  if (isMobile)
    return (
      <Sheet title="Academy">
        <p className="m-lead">Workshops and masterclasses to build your skills, brand and business.</p>
        {list}
        {modal}
      </Sheet>
    )

  return (
    <section className="section page-top">
      <div className="container">
        <SectionTitle first="Dr Bady" underline="Academy" sub="Workshops and masterclasses to build your skills, brand and business." />
        {list}
      </div>
      {modal}
    </section>
  )
}
