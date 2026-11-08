import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Mail, MapPin, Phone, CalendarDays } from 'lucide-react'
import { useData, usePublicList } from '../lib/DataContext'
import { useIsMobile, waLink } from '../lib/hooks'
import { WhatsAppIcon } from '../lib/icons'
import { Sheet } from '../components/MobileShell'
import { BookingForm } from '../components/Forms'
import ListRow from '../components/ListRow'
import { SectionTitle } from './Home'

function Paragraphs({ text = '' }) {
  return text.split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>)
}

export function About() {
  const { settings: s } = useData()
  const body = (
    <div className="about-grid">
      <div className="about-photo"><img src={s.about_image || s.hero_image} alt="Dr Bady" /></div>
      <div className="about-copy">
        <Paragraphs text={s.about_text} />
        <div className="about-ctas">
          <Link to="/book" className="btn btn-gold btn-pill"><CalendarDays size={20} /> Book a Chat</Link>
          <Link to="/products" className="btn btn-outline-dark btn-pill">See my products</Link>
        </div>
      </div>
    </div>
  )
  if (useIsMobile()) return <Sheet title={s.about_title}>{body}</Sheet>
  return (
    <section className="section page-top">
      <div className="container">
        <SectionTitle first="About" underline="Dr Bady" />
        {body}
      </div>
    </section>
  )
}

export function Contact({ title = 'Contact' }) {
  const { settings: s } = useData()
  const info = (
    <ul className="contact-list">
      <li><a href={waLink(s.whatsapp)} target="_blank" rel="noreferrer"><WhatsAppIcon size={22} /> WhatsApp {s.phone}</a></li>
      <li><a href={`tel:${s.phone?.replace(/\s/g, '')}`}><Phone size={22} /> {s.phone}</a></li>
      <li><a href={`mailto:${s.email}`}><Mail size={22} /> {s.email}</a></li>
      {s.location && <li><span><MapPin size={22} /> {s.location}</span></li>}
    </ul>
  )
  if (useIsMobile())
    return (
      <Sheet title={title}>
        <p className="m-lead">Have an idea, project or business challenge? Pick a time and let's talk.</p>
        <BookingForm />
        <h2 className="form-title">Other ways to reach me</h2>
        {info}
      </Sheet>
    )
  return (
    <section className="section page-top">
      <div className="container">
        <SectionTitle first={title === 'Contact' ? 'Get in' : 'Book a'} underline={title === 'Contact' ? 'Touch' : 'Chat'} sub="Have an idea, project or business challenge? Let's talk and turn it into a plan." />
        <div className="contact-grid">
          <div className="card form-card"><BookingForm /></div>
          <aside className="contact-aside">
            <h3>Prefer to talk now?</h3>
            {info}
          </aside>
        </div>
      </div>
    </section>
  )
}

export function Faqs() {
  const faqs = usePublicList('faqs')
  const [open, setOpen] = useState(0)
  const list = (
    <div className="faq-list">
      {faqs?.map((f, i) => (
        <div key={f.id} className={`faq ${open === i ? 'open' : ''}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {f.question} <ChevronDown size={20} />
          </button>
          {open === i && <p>{f.answer}</p>}
        </div>
      ))}
    </div>
  )
  if (useIsMobile()) return <Sheet title="FAQs">{list}</Sheet>
  return (
    <section className="section page-top">
      <div className="container container-narrow">
        <SectionTitle first="Frequently asked" underline="Questions" />
        {list}
      </div>
    </section>
  )
}

/** Mobile "More" tab */
export function More() {
  const { settings: s } = useData()
  return (
    <Sheet title="More">
      <div className="m-list m-list-tight">
        <ListRow compact to="/about" icon="User" title="About Dr Bady" />
        <ListRow compact to="/academy" icon="BookOpen" title="Academy" />
        <ListRow compact to="/faqs" icon="CircleHelp" title="FAQs" />
        <ListRow compact to="/book" icon="CalendarDays" title="Book a Chat" />
      </div>
      <div className="m-talk">
        <WhatsAppIcon size={52} className="m-talk-icon" />
        <div>
          <h3>Let's Talk</h3>
          <p>Have an idea, project or business challenge? Get in touch.</p>
        </div>
        <a href={waLink(s.whatsapp)} target="_blank" rel="noreferrer" className="btn btn-wa btn-pill btn-block">
          <WhatsAppIcon size={26} /> {s.phone}
        </a>
      </div>
      <a href={`mailto:${s.email}`} className="btn btn-outline-dark btn-pill btn-block m-email">
        <Mail size={24} /> Send an Email
      </a>
    </Sheet>
  )
}
